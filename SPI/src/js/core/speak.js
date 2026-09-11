/* SESLİ CEVAP — ajanın kendi sesi.

   Bu katman bir karar değişikliğidir ve gerekçesi yazılı kalmalı.

   Önceki karar: «Sesli cevap (TTS) yoktur: kesinlik katmaz, bedel
   katar.» O gerekçe bir SAYIYI sesli okumak içindi ve hâlâ doğrudur —
   bir ferritin değerini duymak, okumaktan daha kesin yapmaz.

   Yeni gerekçe farklı: ses OKUMAMAK için değil, SIRA ALMAK için var.
   Elin doluyken, yürürken, mutfaktayken Patron'a bir şey sorup cevabı
   duymak; cevap bitince mikrofonun kendiliğinden açılması. Kesinlik
   değil SÜREKLİLİK kazandırıyor.

   ─────────────────────────────────────────────────────────────────

   DEĞİŞMEZ: ses, ekrandaki metinden BAŞKA bir şey söylemez.

   Konuşulan metin, kural motorundan geçmiş ve ekrana basılmış metnin
   ta kendisidir. Burada yeniden yazma, özetleme, "sesli için
   kısaltma" yoktur. Olsaydı duyduğun cümle ile gördüğün cümle
   ayrışırdı ve hangisinin doğru olduğu belirsizleşirdi.

   Yapılan tek şey TELAFFUZ hazırlığıdır: «%40» yazısını «yüzde 40»
   diye okutmak anlamı değiştirmez, yalnızca duyulur kılar.

   Desteklenmeyen tarayıcıda katman sessizce yok olur; hiçbir düğme
   çizilmez, yazılı akış olduğu gibi durur. */

window.SP = window.SP || {};

SP.Speak = (function(){

  const API = window.speechSynthesis || null;
  const Utter = window.SpeechSynthesisUtterance || null;

  function supported(){ return !!(API && Utter); }

  /* ---------------------------------------------------------- sesler

     Tarayıcı ses listesini GEÇ yükler: ilk çağrıda boş dönebilir ve
     `voiceschanged` olayıyla dolar. Bu yüzden liste her istendiğinde
     yeniden okunur, önbelleğe alınmaz. */
  function voices(){
    if(!supported()) return [];
    try{ return API.getVoices() || []; }catch(e){ return []; }
  }

  function turkishVoices(){
    return voices().filter(v => /^tr([-_]|$)/i.test(v.lang || ''));
  }

  /* Türkçe ses yoksa katman yine çalışır ama bunu SÖYLER: yabancı bir
     sesle okunan Türkçe anlaşılmaz olabilir ve kullanıcı sebebini
     bilmelidir. */
  function ready(){
    return supported() && voices().length > 0;
  }
  function hasTurkish(){ return turkishVoices().length > 0; }

  /* ------------------------------------------------- ajan ses kimliği

     Beş ajanın sesi birbirinden AYRILMALI: toplantıyı dinlerken kimin
     konuştuğu duyulmadan anlaşılmalı.

     Tarayıcıda genelde bir ya da iki Türkçe ses bulunur — beş ayrı ses
     bulunmaz. Bu yüzden kimlik yalnız sese değil, KONUŞMA BİÇİMİNE de
     yazılır: hız ve perde. Tek sesle bile beş karakter ayrışır.

     Değerler karakterden çıkar, rastgele değil:
       Patron  — yavaş ve alçak: kararı o veriyor, acelesi yok
       Kerem   — nötr: ölçüm okuyor, yorum katmıyor
       Nesrin  — biraz daha canlı: mutfakta anlatıyor
       Barış   — hızlı: antrenman veriyor
       Sedef   — ölçülü: para konuşuyor, abartmıyor */
  const KIMLIK = {
    patron:{ rate:0.94, pitch:0.92 },
    lab:   { rate:1.00, pitch:1.00 },
    nutri: { rate:1.02, pitch:1.08 },
    move:  { rate:1.10, pitch:1.04 },
    money: { rate:0.98, pitch:0.96 },
  };

  /* Ses ataması KARARLI olmalı: aynı ajan her seferinde aynı sesle
     konuşur. Liste sırası tarayıcıya göre değişebildiği için ajanın
     kendi sırası kullanılır, ses listesinin sırası değil. */
  function voiceFor(agentId){
    const tr = turkishVoices();
    const havuz = tr.length ? tr : voices();
    if(!havuz.length) return null;
    const sira = SP.AGENTS.findIndex(a => a.id === agentId);
    return havuz[(sira < 0 ? 0 : sira) % havuz.length];
  }

  function styleFor(agentId){
    return KIMLIK[agentId] || { rate:1, pitch:1 };
  }

  /* ------------------------------------------------------- telaffuz

     Anlam değişmez, yalnızca duyulur hale gelir. Her kural bir
     okunuş sorununu çözer; süs kural yoktur. */
  function konusulacak(text){
    let s = String(text == null ? '' : text);

    s = s.replace(/\*\*/g, '').replace(/[*_`#]/g, '');   /* işaretleme okunmaz */
    s = s.replace(/%\s*(\d)/g, 'yüzde $1');              /* %40 → yüzde 40 */
    s = s.replace(/(\d)\s*%/g, '$1 yüzde');              /* 40% → 40 yüzde */
    s = s.replace(/([A-Za-zµ])\/([A-Za-z])/g, '$1 $2');  /* ng/mL → ng mL */
    s = s.replace(/[·•]/g, ', ');                        /* ayraç → duraklama */
    s = s.replace(/\s[—–]\s/g, ', ');                    /* uzun tire → duraklama */
    s = s.replace(/→/g, ', ');
    /* Ayraç kendi boşluğunu getirdiği için önündeki boşluk artık
       fazladır: «A · B» → «A , B» diye okunuyordu. */
    s = s.replace(/\s+([,.;:])/g, '$1');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  /* --------------------------------------------------------- söyleme */

  let simdiki = null;      /* { utter, agentId, iptal } */

  /* Bir cümleyi söyler ve BİTİNCE çözülen bir söz döndürür.

     Sözün bitmesi sıra alma döngüsünün tek tetikleyicisidir: mikrofon
     ancak ajan sustuğunda açılır. Bu yüzden hata durumunda bile söz
     MUTLAKA çözülür — çözülmezse döngü sessizce ölür ve kullanıcı
     mikrofonun neden açılmadığını anlamaz. */
  function say(text, opts){
    const o = opts || {};
    const metin = konusulacak(text);
    if(!supported() || !metin) return Promise.resolve({ ok:false, reason:'bos' });

    stop();

    return new Promise(resolve => {
      let bitti = false;
      const bitir = sonuc => { if(bitti) return; bitti = true; simdiki = null; resolve(sonuc); };

      let u;
      try{ u = new Utter(metin); }
      catch(e){ return bitir({ ok:false, reason:'utter' }); }

      const ses = o.voice || voiceFor(o.agent);
      const stil = styleFor(o.agent);
      if(ses){ u.voice = ses; u.lang = ses.lang; }
      else u.lang = o.lang || 'tr-TR';
      u.rate = o.rate != null ? o.rate : stil.rate;
      u.pitch = o.pitch != null ? o.pitch : stil.pitch;
      u.volume = o.volume != null ? o.volume : 1;

      u.onend = () => bitir({ ok:true });
      u.onerror = ev => bitir({ ok:false,
        reason:(ev && ev.error) || 'error',
        /* Kullanıcı kestiyse bu bir hata değil, bir karardır. */
        iptal:!!(ev && (ev.error === 'interrupted' || ev.error === 'canceled')) });

      simdiki = { utter:u, agentId:o.agent || null };
      if(o.onStart) o.onStart();

      try{ API.speak(u); }
      catch(e){ bitir({ ok:false, reason:'speak' }); }
    });
  }

  /* Sırayla söyler. Bir cümle iptal edilirse kalanlar SÖYLENMEZ:
     kullanıcı sözü kestiyse sırayı da kesmiştir. */
  async function sequence(parcalar, opts){
    const o = opts || {};
    for(let i = 0; i < parcalar.length; i++){
      const p = parcalar[i];
      if(o.onPart) o.onPart(p, i);
      const r = await say(p.text, Object.assign({}, o, { agent:p.agent }));
      if(!r.ok && r.iptal) return { ok:false, kesildi:true, kalan:parcalar.length - i };
      if(o.arasiMs) await new Promise(res => setTimeout(res, o.arasiMs));
    }
    return { ok:true, kesildi:false, kalan:0 };
  }

  function stop(){
    if(!supported()) return;
    try{ API.cancel(); }catch(e){}
    simdiki = null;
  }

  function isSpeaking(){
    if(!supported()) return false;
    try{ return API.speaking || API.pending; }catch(e){ return false; }
  }
  function speakingAgent(){ return simdiki ? simdiki.agentId : null; }

  /* Ses listesi geç yüklendiğinde haber ver: mikrofon düğmesi ilk
     çizimde gizli kalıp sonra görünmesin diye ekran tazelenir. */
  function onVoicesReady(fn){
    if(!supported()) return;
    if(voices().length){ fn(); return; }
    const el = () => { API.removeEventListener('voiceschanged', el); fn(); };
    try{ API.addEventListener('voiceschanged', el); }catch(e){}
  }

  return {
    supported, ready, hasTurkish, voices, turkishVoices,
    voiceFor, styleFor, konusulacak,
    say, sequence, stop, isSpeaking, speakingAgent, onVoicesReady,
    KIMLIK,
  };
})();
