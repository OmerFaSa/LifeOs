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

  return { supported, start, stop, isActive, activeTarget, dictateInto, message };
})();
