/* SES TANIMA — dikte katmanı.

   AYS'de ses tanıma vardı ama tek bir ekranın içine gömülüydü
   (`learn.js` → sesli not) ve tek atışlıktı: konuşursun, biter,
   metin alana düşer. Sıra alma döngüsü bunu kullanamazdı çünkü
   döngünün bilmesi gereken şey «kullanıcı SUSTU mu?» sorusudur ve
   tek atışlık tanıma bunu söylemez.

   Bu katman tanımayı ekrandan ayırır ve iki şey ekler:

     · ARA SONUÇ. Konuşurken yazılanı görürsün; sözün metne
       döndüğünü beklemeden anlarsın.
     · SÜREKLİ OTURUM. Tanıma cümle bitince kapanmaz; sessizliği
       döngü ölçer (bkz. core/talk.js).

   Desteklenmeyen tarayıcıda katman sessizce yok olur: düğme
   çizilmez, elle giriş yolu zaten her yerde durur. */

window.R = window.R || {};

R.Listen = (function(){

  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  /* Aynı anda tek oturum: iki alan birden dinlerse hangisine
     yazıldığı belirsizleşir. */
  let aktif = null;

  function supported(){ return !!Rec; }

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

    /* Sabitlenmiş metin burada birikir; ara sonuç bunun üstüne
       eklenir ama birikime YAZILMAZ — yoksa aynı söz iki kez geçer. */
    let sabit = '';

    rec.onresult = ev => {
      let ara = '';
      for(let i = ev.resultIndex; i < ev.results.length; i++){
        const p = ev.results[i][0].transcript;
        if(ev.results[i].isFinal) sabit += p;
        else ara += p;
      }
      const metin = (sabit + ara).replace(/\s+/g, ' ').trim();
      if(o.onText) o.onText(metin, !ara);
    };

    rec.onerror = ev => {
      const kod = (ev && ev.error) || 'error';
      /* «no-speech» bir hata değil, sessizliktir. */
      if(kod !== 'no-speech' && kod !== 'aborted' && o.onError) o.onError(kod);
    };

    rec.onend = () => {
      const vardi = aktif;
      aktif = null;
      if(vardi && o.onEnd) o.onEnd(sabit.replace(/\s+/g, ' ').trim());
    };

    try{ rec.start(); }
    catch(e){ if(o.onError) o.onError('start'); return null; }

    aktif = { rec, target:o.target || null };
    return aktif;
  }

  function stop(){
    if(!aktif) return;
    const a = aktif;
    aktif = null;
    try{ a.rec.stop(); }catch(e){}
  }

  function isActive(){ return !!aktif; }

  /* Bir metin alanına bağlanan dikte. Alandaki mevcut metin KORUNUR:
     yarım yazıp sonra konuşmaya başlayabilirsin. */
  function dictateInto(el, opts){
    const o = opts || {};
    if(!el) return null;
    const taban = el.value ? el.value.replace(/\s+$/, '') + ' ' : '';
    return start({
      target:el.id || null,
      lang:o.lang,
      onText(metin){
        el.value = taban + metin;
        try{ el.selectionStart = el.selectionEnd = el.value.length; }catch(e){}
        if(o.onText) o.onText(el.value);
      },
      onEnd(son){ if(o.onEnd) o.onEnd(taban + son); },
      onError:o.onError,
    });
  }

  const MESAJ = {
    unsupported:'Bu tarayıcı ses tanımayı desteklemiyor. Chrome ya da Edge dene.',
    'not-allowed':'Mikrofon izni verilmedi.',
    'service-not-allowed':'Mikrofon izni verilmedi.',
    'audio-capture':'Mikrofon bulunamadı.',
    network:'Ses tanıma için bağlantı gerekiyor.',
    start:'Mikrofon başlatılamadı.',
  };
  function message(kod){ return MESAJ[kod] || 'Ses tanıma çalışmadı.'; }

  return { supported, start, stop, isActive, dictateInto, message };
})();
