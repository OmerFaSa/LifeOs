/* Ses ile dikte.

   Bu katman KONUSMA degil DIKTE yapar: ses metne cevrilir, metin var olan
   alana yazilir ve oradan sonra her sey yazarak girmisin gibi isler. Yeni
   bir ayristirici, yeni bir kesinlik etiketi, yeni bir kayit yolu yoktur.

   Bu kasitlidir. "Bir tabak etli kuru fasulye, bir bardak ayran" cumlesini
   coktan ayristirabiliyoruz (ESP.Parse.parseMeal). Sesin yapmasi gereken tek
   is o cumleyi klavye yerine uretmek. Sesli cevap (TTS) yoktur: kesinlik
   katmaz, bedel katar.

   Tarayicinin kendi konusma motoru kullanilir. Desteklenmeyen tarayicida
   katman sessizce yok olur -- mikrofon dugmesi hic cizilmez, elle giris
   yolu zaten her yerde durur. */

window.ESP = window.ESP || {};

ESP.Voice = (function(){

  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  /* Ayni anda tek bir oturum. Iki alan birden dinlerse hangi alana
     yazildigi belirsizlesir. */
  let active = null;

  function supported(){ return !!Rec; }

  /* Dikte oturumu.

     `opts.onText(text, final)` her tanima adiminda cagrilir; `final`
     false iken metin henuz degisebilir (ara sonuc), true olunca sabitlenir.
     Cagiran taraf ara sonuclari da yazar ki kullanici konusurken
     yazildigini gorsun. */
  function start(opts){
    const o = opts || {};
    if(!Rec){ if(o.onError) o.onError('unsupported'); return null; }
    stop();

    let rec;
    try{ rec = new Rec(); }
    catch(e){ if(o.onError) o.onError('unsupported'); return null; }

    rec.lang = o.lang || 'tr-TR';
    rec.continuous = o.continuous !== false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    /* Oturum boyunca sabitlenmis metin burada birikir; ara sonuc bunun
       ustune eklenir ama birikime yazilmaz. */
    let settled = '';

    rec.onresult = ev => {
      let interim = '';
      for(let i = ev.resultIndex; i < ev.results.length; i++){
        const piece = ev.results[i][0].transcript;
        if(ev.results[i].isFinal) settled += piece;
        else interim += piece;
      }
      const text = (settled + interim).replace(/\s+/g, ' ').trim();
      if(o.onText) o.onText(text, !interim);
    };

    rec.onerror = ev => {
      const code = ev && ev.error ? ev.error : 'error';
      /* "no-speech" bir hata degil, sessizliktir: kullaniciya hata
         gostermek yerine oturumu sessizce bitiririz. */
      if(code !== 'no-speech' && code !== 'aborted' && o.onError) o.onError(code);
    };

    rec.onend = () => {
      const was = active;
      active = null;
      if(was && o.onEnd) o.onEnd(settled.replace(/\s+/g, ' ').trim());
    };

    try{ rec.start(); }
    catch(e){ if(o.onError) o.onError('start'); return null; }

    active = { rec, target:o.target || null };
    return active;
  }

  function stop(){
    if(!active) return;
    const a = active;
    active = null;
    try{ a.rec.stop(); }catch(e){}
  }

  function isActive(){ return !!active; }
  function activeTarget(){ return active ? active.target : null; }

  /* Bir metin alanina baglanan dikte.

     Alandaki mevcut metin KORUNUR: dikte onun sonuna eklenir. Kullanici
     yarim yazip sonra konusmaya baslayabilsin diye. */
  function dictateInto(el, opts){
    const o = opts || {};
    if(!el) return null;
    const base = el.value ? el.value.replace(/\s+$/, '') + ' ' : '';

    return start({
      target:el.id || null,
      lang:o.lang,
      onText(text){
        el.value = base + text;
        /* Uzun metinde imlec sonda kalsin ki kullanici yazilani gorsun. */
        try{ el.selectionStart = el.selectionEnd = el.value.length; }catch(e){}
        if(o.onText) o.onText(el.value);
      },
      onEnd(final){
        if(o.onEnd) o.onEnd(base + final);
      },
      onError:o.onError,
    });
  }

  const MESSAGES = {
    unsupported:'Bu tarayıcı ses tanımayı desteklemiyor. Chrome ya da Edge dene.',
    'not-allowed':'Mikrofon izni verilmedi.',
    'service-not-allowed':'Mikrofon izni verilmedi.',
    'audio-capture':'Mikrofon bulunamadı.',
    network:'Ses tanıma için bağlantı gerekiyor.',
    start:'Mikrofon başlatılamadı.',
  };
  function message(code){ return MESSAGES[code] || 'Ses tanıma çalışmadı.'; }

  /* ------------------------------------------------ 099 konuşma ölçümü

     Konuşma pratiğinde mikrofonun GENLİĞİ okunur: her 100 ms'de bir RMS
     değeri. Ses KAYDEDİLMEZ, gönderilmez, saklanmaz; elde kalan yalnız
     sayılardır (süre, duraksama, çubuk yükseklikleri). Duraksama: sesin
     eşiğin altında en az 600 ms kalması — konuşmanın ilk ve son sesli
     anı arasında. Hiç ses yoksa ölçü YOK (null), «0 duraksama» değil. */
  function konusmaOlc(ornekler, adimMs, opts){
    const o = opts || {};
    const esik = o.esik != null ? o.esik : 0.02;
    const enAz = Math.max(1, Math.ceil((o.sessizMs || 600) / adimMs));
    const dizi = (ornekler || []).map(Number).filter(v => isFinite(v) && v >= 0);
    const sesli = dizi.map(v => v >= esik);
    const ilk = sesli.indexOf(true), son = sesli.lastIndexOf(true);
    if(ilk < 0) return null;
    const k = dizi.slice(ilk, son + 1), sk = sesli.slice(ilk, son + 1);
    const durak = k.map(() => false);
    let say = 0;
    for(let i = 0; i < k.length;){
      if(sk[i]){ i++; continue; }
      let j = i; while(j < k.length && !sk[j]) j++;
      if(j - i >= enAz){ for(let x = i; x < j; x++) durak[x] = true; say++; }
      i = j;
    }
    const N = Math.min(o.cubuk || 48, k.length);
    const tavan = o.tavan || 0.25;
    const genlik = [];
    for(let b = 0; b < N; b++){
      const a = Math.floor(b * k.length / N), z = Math.max(a + 1, Math.floor((b + 1) * k.length / N));
      const dil = k.slice(a, z);
      const ort = dil.reduce((t, v) => t + v, 0) / dil.length;
      genlik.push(durak.slice(a, z).every(Boolean) ? 0 : Math.max(1, Math.round(16 * Math.min(1, ort / tavan))));
    }
    return { genlik, sureSn:Math.round(k.length * adimMs / 1000), duraksama:say };
  }

  let kayit = null;
  const KAYIT_EN_COK_MS = 90000;
  function kayitVar(){
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext));
  }
  async function kayitBaslat(onBitti){
    if(!kayitVar()) return { ok:false, why:'Bu tarayıcı mikrofonun sesini ölçemiyor.' };
    if(kayit) return { ok:true };
    try{
      const akis = await navigator.mediaDevices.getUserMedia({ audio:true });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(akis).connect(an);
      const buf = new Float32Array(an.fftSize);
      const ornek = [];
      const t = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        let s = 0; for(let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        ornek.push(Math.sqrt(s / buf.length));
        if(ornek.length * 100 >= KAYIT_EN_COK_MS) kayitBitir();
      }, 100);
      kayit = { akis, ctx, t, ornek, onBitti };
      return { ok:true };
    }catch(e){
      return { ok:false, why:'Mikrofon açılamadı ya da izin verilmedi.' };
    }
  }
  function kayitBitir(){
    if(!kayit) return null;
    const k = kayit; kayit = null;
    clearInterval(k.t);
    try{ k.akis.getTracks().forEach(x => x.stop()); }catch(e){}
    try{ k.ctx.close(); }catch(e){}
    const r = konusmaOlc(k.ornek, 100);
    if(k.onBitti) k.onBitti(r);
    return r;
  }
  function kayitSuruyor(){ return !!kayit; }

  return { supported, start, stop, isActive, activeTarget, dictateInto, message,
    konusmaOlc, kayitVar, kayitBaslat, kayitBitir, kayitSuruyor };
})();
