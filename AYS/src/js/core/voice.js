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
  /* Perde araligi KASITLI OLARAK dar. Ilk surumde 0.80-1.24 idi ve
     "her ajanin kendi sesi olsun" istegini karsiliyor gibi gorunuyordu;
     gercekte ses kalitesini bozan sey buydu: konusma sentezleyicileri
     perdeyi ne kadar kaydirirsan o kadar metalik ses uretir. 1.24 perde
     "farkli bir kisi" degil, "bozulmus ayni kisi" gibi duyuluyordu.

     Ayrim once GERCEK SESLERDEN yapilir (cihazda kac ses varsa hepsi
     dagitilir); perde yalnizca ince ayardir. Hiz de 1.0'in cok uzagina
     gitmez: hizli konusma anlasilirligi, yavas konusma dogalligi bozar. */
  const PROFILES = {
    patron: { pitch:0.92, rate:0.97 },
    tyt:    { pitch:1.06, rate:1.02 },
    ayt:    { pitch:0.96, rate:1.00 },
    rehber: { pitch:1.10, rate:0.96 },
    analist:{ pitch:1.00, rate:1.05 },
    koc:    { pitch:0.88, rate:1.03 },
    aday:   { pitch:1.04, rate:1.00 },
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

  /* ---------- ses kalitesi ----------

     Tarayicinin verdigi sesler ESIT DEGILDIR ve aradaki fark buyuktur:
     Linux'ta eSpeak metalik ve robotik konusur, Chrome'un "Google turkce"
     sesi ya da Edge'in "Natural/Neural" sesleri neredeyse insan gibidir.
     Ilk surum listeden SIRAYLA aliyordu; cihazda iyi ses olsa bile
     kotusune denk gelebiliyordu. "Ses kalitesi kotu" sikayetinin sebebi
     buydu — sentezleyiciyi biz yazamayiz ama HANGISINI kullandigimizi
     secebiliriz.

     Puanlama isimlerden ve bayraklardan okunur; hicbiri kesin degildir,
     bu yuzden puan sirasi bir TERCIH sirasidir, filtre degil. */
  function score(v){
    const name = String(v.name || '').toLowerCase();
    const lang = String(v.lang || '');
    let n = 0;
    /* Turkce olmak her seyden onemli: iyi bir Ingilizce ses Turkce metni
       okuyamaz. */
    if(/^tr\b|^tr[-_]/i.test(lang)) n += 200;
    /* Sinirsel/bulut sesler yerel gomulu seslerden belirgin iyidir. */
    if(/natural|neural/.test(name)) n += 60;
    if(/google/.test(name)) n += 45;
    if(/microsoft/.test(name)) n += 25;
    if(/online/.test(name)) n += 20;
    if(v.localService === false) n += 30;
    /* Bilinen robotik motorlar geriye atilir. */
    if(/espeak|festival|pico|compact|klatt/.test(name)) n -= 80;
    if(v.default) n += 3;
    return n;
  }

  /* Turkce sesler once ve KALITE SIRASIYLA; hicbiri yoksa liste oldugu
     gibi kullanilir — yabanci bir sesle Turkce okumak, hic okumamaktan
     iyidir. */
  function voices(){
    const all = (cached && cached.length) ? cached : rawVoices();
    const tr = all.filter(v => /^tr\b|^tr[-_]/i.test(v.lang || ''));
    const use = tr.length ? tr : all;
    return use.slice().sort((a, b) => score(b) - score(a));
  }

  /* Cihazdaki en iyi ses gercekten iyi mi? Ekran "bu cihazda ses kalitesi
     dusuk" diyebilsin diye. */
  function quality(list){
    const use = Array.isArray(list) ? list.slice().sort((a, b) => score(b) - score(a)) : voices();
    if(!use.length) return { level:'yok', voice:null };
    const best = use[0];
    const n = score(best);
    return {
      voice:best,
      level:n >= 260 ? 'iyi' : n >= 200 ? 'orta' : 'dusuk',
      turkish:/^tr\b|^tr[-_]/i.test(String(best.lang || '')),
      count:use.length,
    };
  }

  function byURI(uri, list){
    if(!uri) return null;
    const use = Array.isArray(list) ? list : voices();
    return use.find(v => (v.voiceURI || v.name) === uri) || null;
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
  /* Kullanicinin ajan basina sectigi sesler. Ofis ayarlarinda durur ve
     otomatik dagitimin USTUNDEDIR: "her ajanin kendine has sesi olsun"
     isteginin tam karsiligi budur — cihazda hangi ses varsa kullanici
     kendi eslestirmesini yapabilmeli. */
  function overrides(){
    try{ return (R.Office.settings().voices) || {}; }
    catch(e){ return {}; }
  }

  function profileFor(agentId, ids, list){
    const base = PROFILES[agentId] || PROFILES.aday;
    const chosen = byURI(overrides()[agentId], list);
    const voice = chosen || assign(ids, list)[agentId] || null;
    return {
      voice,
      name:voice ? voice.name : null,
      chosen:!!chosen,
      pitch:base.pitch,
      rate:base.rate,
    };
  }

  /* Cihazda kac ayri ses var? Ekran "hepsi ayni sesle konusuyor" durumunu
     kullaniciya soyleyebilsin diye. */
  function voiceCount(){ return voices().length; }

  /* ---------- metnin okunusa hazirlanmasi ----------

     Ekranda dogru gorunen metin, sesli okundugunda yanlis duyulur:

       "%78"        → sentezleyici "yuzde" demez, isareti ya atlar ya da
                      "yuzde" yerine sayidan SONRA okur.
       "TYT"        → tek hece gibi "tit" diye okunur; dogrusu harf harf.
       "x^2"        → "x sapka iki" diye okunur.
       "5/40"       → "bes bolu kirk" degil "bes kirk" diye gecer.
       "1.500"      → bazi motorlar "bir nokta bes yuz" der.

     Bunlar duzeltilmezse ses kalitesi degil, ANLASILIRLIK bozulur — ve
     kullanicinin "kotu" dedigi seyin buyuk kismi budur. Metin yalniz
     KONUSMA icin donusturulur; ekranda gorunen degismez. */

  /* Harf harf okunmasi gereken kisaltmalar. Turkce harf adlariyla
     yazilir, yoksa motor Ingilizce harf adi kullanir ("ti vay ti"). */
  const SPELL = {
    'TYT':'Te Ye Te', 'AYT':'A Ye Te', 'YKS':'Ye Ka Se', 'ÖSYM':'Ö Se Ye Me',
    'YDT':'Ye De Te', 'MEB':'Me E Be', 'SRS':'Se Er Se',
    'K/İ/Y/S/D':'Ka, İ, Ye, Se, De',
  };

  function speechText(text){
    let t = String(text || '');
    if(!t) return '';

    /* Kisaltmalar — once, cunku sonraki adimlar harfleri bozabilir. */
    Object.keys(SPELL).forEach(k => {
      t = t.split(k).join(SPELL[k]);
    });

    /* Yuzde isareti Turkce'de sayidan ONCE okunur. */
    t = t.replace(/%\s*(\d+(?:[.,]\d+)?)/g, 'yüzde $1');

    /* Binlik ayraci noktasi okunmasin: 1.500 → 1500 */
    t = t.replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2');

    /* Matematik yazimi. Ekranda "x^2" dogru, kulakta "x kare" dogru. */
    t = t.replace(/\^2\b/g, ' kare').replace(/\^3\b/g, ' küp')
         .replace(/\^(\d+)/g, ' üzeri $1');
    t = t.replace(/\bkök\s*\(([^)]{1,12})\)/gi, 'kök $1');
    t = t.replace(/(\d)\s*\/\s*(\d)/g, '$1 bölü $2');
    /* SIRA ONEMLI: cift karakterli isaretler once. Tersi, "=" kuralinin
       "<=" icindeki esittiri yiyip "buyuktur esittir" uretmesine yol
       aciyordu ve digger iki kural hic calismiyordu. */
    t = t.replace(/\s*<=\s*/g, ' küçük eşittir ').replace(/\s*>=\s*/g, ' büyük eşittir ')
         .replace(/\s*!=\s*/g, ' eşit değildir ')
         .replace(/\s*=\s*/g, ' eşittir ')
         .replace(/\s*<\s*/g, ' küçüktür ').replace(/\s*>\s*/g, ' büyüktür ');

    /* Okunmayan isaretler: madde imleri, yildizlar, uzun tireler. */
    t = t.replace(/[*_`#|]/g, ' ').replace(/[—–]/g, ', ');

    /* Cok satirli metin: bos satir bir duraklamadir. Sentezleyici satir
       sonunu duraklama saymaz; noktalamaya cevrilir. */
    t = t.replace(/\n{2,}/g, '. ').replace(/\n/g, ', ');

    /* Ust uste birikmis noktalama ve bosluk. Noktalamadan ONCEKI bosluk da
       silinir: "bir , iki" duraklamayi yanlis yere koyar. */
    t = t.replace(/([.,;:!?])\s*(?=[.,;:])/g, '')
         .replace(/\s+([.,;:!?])/g, '$1')
         .replace(/\s{2,}/g, ' ')
         .trim();
    return t;
  }

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
    /* Metin KONUSMA icin donusturulur; ekranda gorunen degismez. */
    const parts = chunks(o.raw ? text : speechText(text));
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
    score, quality, byURI, speechText, overrides,
    PROFILES, PACE, PACE_ORDER, paceOf, LANG, CHUNK, MIN_HOLD, SPELL,
  };
})();
