/* Model saglayicilari — ofis ajanlarinin kullandigi ucretsiz LLM uclari.

   Bu dosya ICERIKTIR, mantik degil: uc nokta adresleri, model kimlikleri ve
   istek sinirlari saglayicilar tarafindan sik degistirilir. Motor
   (core/llm.js) ve kota yoneticisi (core/quota.js) burayi yalnizca okur.

   KATALOG ESKIR — VE BU NORMALDIR.
   Ucretsiz model kimlikleri aylik doner: OpenRouter'da ":free" listesi
   surekli degisir, Google 2.0 Flash'i Mart 2026'da emekli etti. Bu yuzden
   asagidaki liste artik TEK kaynak degil, yalnizca TOHUMDUR: kullanici
   ayar ekranindaki "Modelleri yenile" ile saglayicinin KENDI listesini
   ceker (__NS__.LLM.listModels) ve secim o listeden yapilir. Buradaki liste
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
   anahtarinda durur. Yedege girmez, buluta gitmez, LLM'e gonderilmez.

   ================== BU DOSYA TEK KAYNAKTIR ==================
   Kaynagi `brand/ortak/providers.js`; `python3 tools/ortak.py --yay` ile
   uc arayuze yayilir. Katalog bir kez guncellenir, uc sistem ayni
   modelleri ve sinirlari gorur (2.0 Flash emekli olunca SPI ve ESP'de
   eski liste kalmisti). */
window.LIFEOS.PARCA.yazilar({
  'ortak.providers.yerlesik-bu-uygulama':'Yerleşik (bu uygulama)',
  'ortak.providers.uygulama-claude-icinde-calis':'Uygulama Claude içinde çalışıyorsa açıktır. Anahtar istemez, ayar gerektirmez.',
  'ortak.providers.varsayilan':'Varsayılan',
  'ortak.providers.hizli':'Hızlı',
  'ortak.providers.openrouter':'OpenRouter',
  'ortak.providers.ucretsiz-modellerin-cogu-bur':'Ücretsiz modellerin çoğu burada toplanır. Dakikada 20 istek sınırı vardır; ',
  'ortak.providers.50-gun-hic':'50 / gün — hiç kredi yüklemedim',
  'ortak.providers.1000-gun-bir':'1000 / gün — bir kez 10 $ yükledim',
  'ortak.providers.deepseek-v3':'DeepSeek V3',
  'ortak.providers.llama-3-3-70b':'Llama 3.3 70B',
  'ortak.providers.qwen-2-5-72b':'Qwen 2.5 72B',
  'ortak.providers.mistral-small-3-2':'Mistral Small 3.2',
  'ortak.providers.deepseek-r1':'DeepSeek R1',
  'ortak.providers.groq':'Groq',
  'ortak.providers.ucretsiz-katmani-cok-hizlidi':'Ücretsiz katmanı çok hızlıdır: dakikada 30 istek. Günlük hak modele göre ',
  'ortak.providers.llama-3-1-8b':'Llama 3.1 8B',
  'ortak.providers.gpt-oss-120b':'GPT-OSS 120B',
  'ortak.providers.gpt-oss-20b':'GPT-OSS 20B',
  'ortak.providers.qwen-3-32b':'Qwen 3 32B',
  'ortak.providers.google-ai-studio':'Google AI Studio',
  'ortak.providers.ucretsiz-katmanda-gunde-1000':'Ücretsiz katmanda günde 1000–1500 isteğe kadar hak vardır; dakikalık sınır ',
  'ortak.providers.gemini-2-5-flash':'Gemini 2.5 Flash',
  'ortak.providers.gemini-2-5-flash-lite':'Gemini 2.5 Flash Lite',
  'ortak.providers.gemini-3-flash':'Gemini 3 Flash',
  'ortak.providers.gemini-3-1-flash-lite':'Gemini 3.1 Flash Lite',
  'ortak.providers.ollama-kendi-bilgisayarin':'Ollama (kendi bilgisayarın)',
  'ortak.providers.modeli-kendi-bilgisayarinda':'Modeli kendi bilgisayarında çalıştırır: kota yok, ücret yok, internet gerekmez. ',
  'ortak.providers.qwen-2-5-7b':'Qwen 2.5 7B',
  'ortak.providers.gemma-2-9b':'Gemma 2 9B',
  'ortak.providers.mistral-nemo':'Mistral Nemo',
  'ortak.providers.lm-studio-kendi-bilgisayarin':'LM Studio (kendi bilgisayarın)',
  'ortak.providers.lm-studio-da-yerel-sunucuyu':'LM Studio’da yerel sunucuyu başlat ve CORS’u aç. Kota yok, ücret yok. ',
  'ortak.providers.ozel-uc-openai-uyumlu':'Özel uç (OpenAI uyumlu)',
  'ortak.providers.openai-uyumlu-bir-adres-ver':'OpenAI uyumlu bir adres ver: ister tam /chat/completions yolu, ister yalnız ',
  'ortak.providers.kisa-yorumlar-icin-yeterli':'Kısa yorumlar için yeterli',
  'ortak.providers.dengeli':'Dengeli',
  'ortak.providers.gunluk-kullanim':'Günlük kullanım',
  'ortak.providers.derin':'Derin',
  'ortak.providers.toplanti-ve-kok-neden-icin':'Toplantı ve kök neden için',
});


window.__NS__ = window.__NS__ || {};

__NS__.PROVIDERS = {

  /* Uygulama Artifact olarak calisirken acik olan yerlesik yetenek.
     Anahtar istemez; ucretsiz modellerin hicbiri kurulmadan da ofis calisir. */
  builtin: {
    id:'builtin',
    label:yz('ortak.providers.yerlesik-bu-uygulama'),
    kind:'builtin',
    auth:'none',
    free:true,
    needsKey:false,
    note:yz('ortak.providers.uygulama-claude-icinde-calis'),
    /* Yerlesik yetenegin kendi sinirlari vardir ve disaridan okunamaz;
       kota yoneticisi bu yuzden araya girmez. */
    models:[
      { id:'default', label:yz('ortak.providers.varsayilan'), strength:'denge', vision:false },
      { id:'quick',   label:yz('ortak.providers.hizli'),      strength:'hız',   vision:false },
    ],
  },

  openrouter: {
    id:'openrouter',
    label:yz('ortak.providers.openrouter'),
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
    note:yz('ortak.providers.ucretsiz-modellerin-cogu-bur')
       + 'günlük hak hesabında hiç kredi yoksa 50, bir kez 10 $ yüklediysen 1000 istektir. '
       + 'Ücretsiz model listesi sık değişir: "Modelleri yenile" ile güncelini çek.',
    checked:'2026-09 · openrouter.ai/docs/api-reference/limits',
    /* Tum ucretsiz modeller ayni havuzu paylasir. */
    limits:{ rpm:20, rpd:50 },
    /* Gunluk hak hesaba bagli oldugu icin kullanici ayarlardan yukseltebilir. */
    rpdChoices:[
      { value:50,   label:yz('ortak.providers.50-gun-hic') },
      { value:1000, label:yz('ortak.providers.1000-gun-bir') },
    ],
    /* Tohum liste. ":free" kuyrugu olmayan kimlik UCRETLIDIR; yenileme
       suzgeci bunu ayirir. */
    models:[
      { id:'deepseek/deepseek-chat-v3-0324:free',            label:yz('ortak.providers.deepseek-v3'),       free:true, strength:'analiz' },
      { id:'meta-llama/llama-3.3-70b-instruct:free',         label:yz('ortak.providers.llama-3-3-70b'),     free:true, strength:'denge' },
      { id:'qwen/qwen-2.5-72b-instruct:free',                label:yz('ortak.providers.qwen-2-5-72b'),      free:true, strength:'denge' },
      { id:'mistralai/mistral-small-3.2-24b-instruct:free',  label:yz('ortak.providers.mistral-small-3-2'), free:true, strength:'hız' },
      { id:'deepseek/deepseek-r1-0528:free',                 label:yz('ortak.providers.deepseek-r1'),       free:true, strength:'akıl yürütme' },
    ],
  },

  groq: {
    id:'groq',
    label:yz('ortak.providers.groq'),
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
    note:yz('ortak.providers.ucretsiz-katmani-cok-hizlidi')
       + '1000 ile 14 400 arasında değişir. Toplantı için en akıcı seçenek.',
    checked:'2026-09 · console.groq.com/docs/rate-limits',
    limits:{ rpm:30, rpd:1000 },
    models:[
      { id:'llama-3.3-70b-versatile', label:yz('ortak.providers.llama-3-3-70b'), free:true, strength:'denge',
        vision:false, limits:{ rpm:30, rpd:1000,  tpm:12000 } },
      { id:'llama-3.1-8b-instant',    label:yz('ortak.providers.llama-3-1-8b'),  free:true, strength:'hız',
        limits:{ rpm:30, rpd:14400, tpm:6000 } },
      { id:'openai/gpt-oss-120b',     label:yz('ortak.providers.gpt-oss-120b'),  free:true, strength:'analiz',
        limits:{ rpm:30, rpd:1000,  tpm:8000 } },
      { id:'openai/gpt-oss-20b',      label:yz('ortak.providers.gpt-oss-20b'),   free:true, strength:'denge',
        limits:{ rpm:30, rpd:1000,  tpm:8000 } },
      { id:'qwen/qwen3-32b',          label:yz('ortak.providers.qwen-3-32b'),    free:true, strength:'analiz',
        limits:{ rpm:30, rpd:1000,  tpm:6000 } },
    ],
  },

  gemini: {
    id:'gemini',
    label:yz('ortak.providers.google-ai-studio'),
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
    note:yz('ortak.providers.ucretsiz-katmanda-gunde-1000')
       + 'modele göre 10 ile 30 istek arasındadır. Uzun toplantılar için uygun. '
       + 'Yeni anahtarlar "AQ." ile başlar; ikisi de çalışır. '
       + 'Soru fotoğrafı okuyabilen tek ücretsiz seçenek burasıdır.',
    checked:'2026-09 · ai.google.dev/gemini-api/docs/rate-limits',
    /* Model bilinmiyorsa buraya duser — dar tutulur, kota asilmasin. */
    limits:{ rpm:10, rpd:1000 },
    models:[
      { id:'gemini-2.5-flash',      label:yz('ortak.providers.gemini-2-5-flash'),      free:true, strength:'analiz',
        vision:true, limits:{ rpm:15, rpd:1500 } },
      { id:'gemini-2.5-flash-lite', label:yz('ortak.providers.gemini-2-5-flash-lite'), free:true, strength:'hız',
        vision:true, limits:{ rpm:30, rpd:1500 } },
      { id:'gemini-3-flash-preview', label:yz('ortak.providers.gemini-3-flash'),       free:true, strength:'denge',
        vision:true, limits:{ rpm:10, rpd:1500 } },
      /* Sinirlari dogrulanmadi: saglayici varsayilanina duser. */
      { id:'gemini-3.1-flash-lite', label:yz('ortak.providers.gemini-3-1-flash-lite'), free:true, strength:'hız',
        vision:true },
    ],
  },

  /* Bilgisayarda calisan model. Kotasi, ucreti ve internet ihtiyaci YOKTUR;
     ucretsiz katmanlarin butun sinirlarindan kacmanin tek yolu budur. */
  ollama: {
    id:'ollama',
    label:yz('ortak.providers.ollama-kendi-bilgisayarin'),
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
    note:yz('ortak.providers.modeli-kendi-bilgisayarinda')
       + 'Tarayıcıdan erişebilmek için Ollama’yı OLLAMA_ORIGINS="*" ile başlatman gerekir. '
       + 'Türkçe için 7B ve üstü bir model seç.',
    checked:'2026-09 · ollama.com/blog/openai-compatibility',
    models:[
      { id:'llama3.1:8b',   label:yz('ortak.providers.llama-3-1-8b'),   free:true, strength:'denge' },
      { id:'qwen2.5:7b',    label:yz('ortak.providers.qwen-2-5-7b'),    free:true, strength:'hız' },
      { id:'gemma2:9b',     label:yz('ortak.providers.gemma-2-9b'),     free:true, strength:'denge' },
      { id:'mistral-nemo',  label:yz('ortak.providers.mistral-nemo'),   free:true, strength:'analiz' },
    ],
  },

  lmstudio: {
    id:'lmstudio',
    label:yz('ortak.providers.lm-studio-kendi-bilgisayarin'),
    kind:'openai',
    auth:'bearer',
    free:true,
    needsKey:false,
    keyOptional:true,
    endpoint:'http://localhost:1234/v1/chat/completions',
    modelsUrl:'http://localhost:1234/v1/models',
    editableEndpoint:true,
    keyUrl:'https://lmstudio.ai',
    note:yz('ortak.providers.lm-studio-da-yerel-sunucuyu')
       + 'Model kimliğini "Modelleri yenile" ile doğrudan LM Studio’dan çekebilirsin.',
    checked:'2026-09 · lmstudio.ai/docs/local-server',
    models:[],
  },

  /* Kendi sunucusunu ya da listede olmayan bir saglayiciyi kullanmak icin.
     OpenAI uyumlu /chat/completions bekler. Sinir bilinmedigi icin
     kota yoneticisi araya girmez; kullanici kendi sinirini ayarlardan yazar. */
  custom: {
    id:'custom',
    label:yz('ortak.providers.ozel-uc-openai-uyumlu'),
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
    note:yz('ortak.providers.openai-uyumlu-bir-adres-ver')
       + 'taban adres (…/v1) — eksik yol tamamlanır. Anahtar istemeyen bir uç ise '
       + 'anahtar alanını boş bırak. İstek sınırını kendin yazabilirsin.',
    models:[],
  },
};

/* Sirali liste — ayar ekrani bu sirayla gosterir. */
__NS__.PROVIDER_ORDER = ['builtin', 'openrouter', 'groq', 'gemini', 'ollama', 'lmstudio', 'custom'];

/* Ajan basina onerilen model gucu: kural motoru zaten hesabi yapar,
   modelden beklenen yalnizca kisa ve net Turkce yorumdur. */
__NS__.MODEL_TIERS = {
  hiz:   { label:yz('ortak.providers.hizli'),   note:yz('ortak.providers.kisa-yorumlar-icin-yeterli') },
  denge: { label:yz('ortak.providers.dengeli'), note:yz('ortak.providers.gunluk-kullanim') },
  analiz:{ label:yz('ortak.providers.derin'),   note:yz('ortak.providers.toplanti-ve-kok-neden-icin') },
};
