/* Ses katmani — ofis ajanlarinin konusmasi ve okuma ritmi.

   Iki isi vardir:

   1) HER AJANA AYRI BIR SES. Tarayicinin ses listesinden Turkce sesler
      ayiklanir ve ajanlara DAGITILIR; ayni ses ikinci kez kullanilmadan
      once hepsi bir kez kullanilir. Cihazda tek Turkce ses varsa perde ve
      hiz ayrimi devreye girer — kimin konustugu bakmadan anlasilmalidir.

   2) KONUSMANIN BITTIGINI HABER VERMEK. speak() bir SOZ verir ve konusma
      gercekten bittiginde cozulur; toplanti dongusu bunu bekleyerek
      ilerler, boylece biri konusurken digeri araya girmez.

   Web Speech API'nin uc bilinen tuzagi vardir ve ucu de burada kapatilir:

     a) getVoices() ilk cagrida BOS doner; liste 'voiceschanged' ile gelir.
     b) Uzun metinlerde Chrome ~15 sn sonra sessizce durur ve onend hic
        gelmez. Metin cumlelere bolunerek okunur: her parca kisadir.
     c) onend hic gelmeyebilir (sekme arka plana atilir, ses aygiti duser).
        Her parca icin uzunluguna gore bir emniyet suresi konur; sure
        dolarsa konusma bitmis sayilir ve toplanti KILITLENMEZ.

   Ses yoksa ya da bozuksa hicbir sey kirilmaz: speak() hemen cozulur. */

window.R = window.R || {};

R.Voice = (function(){

  const LANG = 'tr-TR';
  /* Tek bir parcanin en fazla uzunlugu. Kisa parca = guvenilir onend. */
  const CHUNK = 180;

  /* Ajan sesleri. Perde ve hiz, cihazda tek ses olsa bile ajanlari
     ayirt edilebilir kilar; ayri ses bulunursa ustune biner. */
  const PROFILES = {
    patron: { pitch:0.80, rate:0.95 },
    tyt:    { pitch:1.12, rate:1.03 },
    ayt:    { pitch:0.92, rate:0.99 },
    rehber: { pitch:1.24, rate:0.93 },
    analist:{ pitch:1.00, rate:1.10 },
    aday:   { pitch:1.05, rate:1.00 },
  };

  /* Okuma hizi: kelime/saniye. Sesli degilken turlar arasindaki mola
     bununla hesaplanir — sabit bir bekleme, kisa ve uzun konusmaya ayni
     sureyi verirdi. */
  const PACE = {
    hizli:  { wps:4.2, label:'Hızlı',  min:500,  max:5000 },
    normal: { wps:2.8, label:'Normal', min:900,  max:9000 },
    yavas:  { wps:1.8, label:'Yavaş',  min:1400, max:14000 },
  };
  const PACE_ORDER = ['hizli', 'normal', 'yavas'];

  function paceOf(id){ return PACE[id] || PACE.normal; }

  /* Iki konusma arasindaki en kisa aralik: yapisik gelmesinler. */
  const MIN_HOLD = 300;

  /* Bir metnin okunmasi ne kadar surer? Kelime sayisina baglidir; cok kisa
     ve cok uzun konusmalar icin taban ve tavan vardir. */
  function readMs(text, pace){
    const p = paceOf(pace);
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    if(!words) return 0;
    return Math.max(p.min, Math.min(p.max, Math.round(words / p.wps * 1000)));
  }

  /* Bir konusma ekrana dustukten sonra ne kadar beklenmeli?

     DEGISMEZ KURAL: bir konusma, okunmasi icin gereken sureden AZ ekranda
     kalmaz. spent — o konusmanin ZATEN gecirdigi sure: akarken ekranda
     durdugu ya da sesli modda okundugu sure. Ikisi de okuma sayilir ve
     dusulur; kalan sure beklenir.

     Bu kural iki ayri arizayi birden kapatir:
       - Model akisi hizliysa turlar goz acip kapayana kadar geciyordu.
       - Sesli modda cihazda hic ses yoksa konusma aninda "bitmis" donuyor
         ve toplanti 300 ms'de bir tur atiyordu — yani sesli mod, sikayet
         edilen hizli akisin daha betersi oluyordu. */
  function holdMs(text, pace, spent){
    /* Zamanlayici tam sayi ms bekler; kesir anlamsizdir. */
    return Math.max(MIN_HOLD, Math.round(readMs(text, pace) - Math.max(0, spent || 0)));
  }

  /* ---------- yetenek ---------- */

  function synth(){
    return (typeof window !== 'undefined' && window.speechSynthesis) || null;
  }
  function available(){
    return !!(synth() && typeof window.SpeechSynthesisUtterance === 'function');
  }

  /* ---------- ses listesi ----------
     getVoices() ilk cagrida bos donebilir; liste sonra 'voiceschanged' ile
     gelir. Bekleme sonsuz degildir: ses hic gelmezse sessizce vazgecilir. */

  let cached = null;
  let waiting = null;

  function rawVoices(){
    const s = synth();
    if(!s) return [];
    try{ return s.getVoices() || []; }catch(e){ return []; }
  }

  function load(timeoutMs){
    if(cached && cached.length) return Promise.resolve(cached);
    if(waiting) return waiting;
    const s = synth();
    if(!s) return Promise.resolve([]);

    const now = rawVoices();
    if(now.length){ cached = now; return Promise.resolve(cached); }

    waiting = new Promise(resolve => {
      let done = false;
      const finish = () => {
        if(done) return;
        done = true;
        clearTimeout(timer);
        try{ s.removeEventListener('voiceschanged', finish); }catch(e){}
        cached = rawVoices();
        waiting = null;
        resolve(cached);
      };
      const timer = setTimeout(finish, timeoutMs || 2000);
      try{ s.addEventListener('voiceschanged', finish); }catch(e){ finish(); }
    });
    return waiting;
  }

  /* Turkce sesler once; hicbiri yoksa liste oldugu gibi kullanilir —
     yabanci bir sesle Turkce okumak, hic okumamaktan iyidir. */
  function voices(){
    const all = (cached && cached.length) ? cached : rawVoices();
    const tr = all.filter(v => /^tr\b|^tr[-_]/i.test(v.lang || ''));
    return tr.length ? tr : all;
  }

  /* ---------- ajan → ses dagitimi ----------
     Ayni ses ikinci kez kullanilmadan once hepsi bir kez kullanilir. */

  let assigned = null;      // agentId -> SpeechSynthesisVoice
  let assignedFor = '';     // dagitimin yapildigi ses listesinin imzasi

  function signature(list){
    return list.map(v => v.voiceURI || v.name).join('|');
  }

  /* list verilmezse cihazin ses listesi kullanilir ve sonuc onbellege
     alinir. Acikca bir liste verildiginde onbellege DOKUNULMAZ: cagiran
     kendi listesini sorguluyor demektir. */
  function assign(ids, list){
    const given = Array.isArray(list);
    const use = given ? list : voices();
    const sig = signature(use);
    if(!given && assigned && assignedFor === sig) return assigned;

    const map = {};
    (ids || Object.keys(PROFILES)).forEach((id, i) => {
      map[id] = use.length ? use[i % use.length] : null;
    });
    if(!given){ assigned = map; assignedFor = sig; }
    return map;
  }

  /* Bir ajanin ses ayari: { voice, pitch, rate, name }. */
  function profileFor(agentId, ids, list){
    const base = PROFILES[agentId] || PROFILES.aday;
    const map = assign(ids, list);
    const voice = map[agentId] || null;
    return {
      voice,
      name:voice ? voice.name : null,
      pitch:base.pitch,
      rate:base.rate,
    };
  }

  /* Cihazda kac ayri ses var? Ekran "hepsi ayni sesle konusuyor" durumunu
     kullaniciya soyleyebilsin diye. */
  function voiceCount(){ return voices().length; }

  /* ---------- konusma ---------- */

  function cancel(){
    const s = synth();
    if(!s) return;
    try{ s.cancel(); }catch(e){}
  }

  /* Metni cumle siniriyla kisa parcalara boler. Uzun tek cumle de bolunur:
     amac her parcanin onend'inin guvenilir gelmesidir. */
  /* Metni cumlelere ayirir.

     Regex ile yazilmis ilk hâli metin KAYBEDIYORDU: "Hedef 1.500 soru."
     icinde noktadan sonra rakam gelince desen eslesmiyor ve o parca
     dusuyordu. Elle yuruyen bu surum hicbir karakteri atmaz — kayip bir
     cumle, bolunmus bir sayidan cok daha kotudur.

     Kural: noktalamayi bosluk ya da metin sonu izlemeli. */
  const STOP = '.!?…';

  function sentences(s){
    const out = [];
    let start = 0;
    for(let i = 0; i < s.length; i++){
      if(STOP.indexOf(s[i]) < 0) continue;
      let j = i;                                   // ust uste noktalama: "!?"
      while(j + 1 < s.length && STOP.indexOf(s[j+1]) >= 0) j++;
      const next = s[j+1];
      if(next === undefined || /\s/.test(next)){
        const piece = s.slice(start, j + 1).trim();
        if(piece) out.push(piece);
        start = j + 1;
      }
      i = j;
    }
    const tail = s.slice(start).trim();
    if(tail) out.push(tail);
    return out;
  }

  function chunks(text){
    const s = String(text || '').trim();
    if(!s) return [];
    const parts = [];
    const sentences_ = sentences(s);
    const list = sentences_.length ? sentences_ : [s];
    let buf = '';
    list.forEach(raw => {
      let piece = raw.trim();
      if(!piece) return;
      while(piece.length > CHUNK){
        const cut = piece.lastIndexOf(' ', CHUNK);
        const at = cut > CHUNK * 0.5 ? cut : CHUNK;
        if(buf){ parts.push(buf); buf = ''; }
        parts.push(piece.slice(0, at).trim());
        piece = piece.slice(at).trim();
      }
      if((buf + ' ' + piece).trim().length > CHUNK){ parts.push(buf); buf = piece; }
      else buf = (buf ? buf + ' ' : '') + piece;
    });
    if(buf) parts.push(buf);
    return parts.filter(Boolean);
  }

  /* Bir parca icin emniyet suresi: onend hic gelmezse toplanti kilitlenmesin.
     Yavas bir sesin saniyede ~10 karakter okudugu varsayilir. */
  function budgetMs(text, rate){
    const r = Math.max(0.5, Number(rate) || 1);
    return Math.min(45000, 3000 + (String(text).length / (10 * r)) * 1000);
  }

  function speakChunk(text, profile, signal){
    return new Promise(resolve => {
      const s = synth();
      if(!s || !available()){ resolve('unavailable'); return; }

      let done = false;
      let timer = null;
      const finish = why => {
        if(done) return;
        done = true;
        clearTimeout(timer);
        if(signal) signal.removeEventListener('abort', onAbort);
        resolve(why);
      };
      const onAbort = () => { cancel(); finish('cancelled'); };

      let u;
      try{
        u = new window.SpeechSynthesisUtterance(text);
      }catch(e){ resolve('error'); return; }

      u.lang = LANG;
      if(profile && profile.voice) u.voice = profile.voice;
      u.pitch = (profile && profile.pitch) || 1;
      u.rate = (profile && profile.rate) || 1;
      u.onend = () => finish('end');
      u.onerror = () => finish('error');

      if(signal){
        if(signal.aborted){ resolve('cancelled'); return; }
        signal.addEventListener('abort', onAbort);
      }
      timer = setTimeout(() => finish('timeout'), budgetMs(text, u.rate));

      try{ s.speak(u); }
      catch(e){ finish('error'); }
    });
  }

  /* Metni bastan sona okur ve BITTIGINDE cozulur.
     Iptal edilirse ya da ses yoksa yine cozulur — cagiran hicbir kosulda
     asili kalmaz. */
  async function speak(text, profile, opts){
    const o = opts || {};
    if(!available()) return 'unavailable';
    const parts = chunks(text);
    if(!parts.length) return 'empty';

    /* Onceki konusma bitmediyse kesilir: iki ses ust uste binmemeli. */
    cancel();

    for(let i = 0; i < parts.length; i++){
      if(o.signal && o.signal.aborted) return 'cancelled';
      const why = await speakChunk(parts[i], profile, o.signal);
      if(why === 'cancelled') return 'cancelled';
      if(why === 'unavailable' || why === 'error') return why;
    }
    return 'end';
  }

  return {
    available, load, voices, voiceCount, assign, profileFor, speak, cancel,
    readMs, holdMs, chunks, sentences, budgetMs,
    PROFILES, PACE, PACE_ORDER, paceOf, LANG, CHUNK, MIN_HOLD,
  };
})();
