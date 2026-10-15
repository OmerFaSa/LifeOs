/* SESLİ SOHBET — sıra alma döngüsü.

   Dikte ile sohbet arasındaki fark düğmedir. Dikte: mikrofona
   söylersin, alana yazılır, «Sor»a basarsın, cevabı okursun. Sohbet:
   sen susarsın, sıra koça geçer, o konuşur, susar, sıra sana döner.
   Arada düğme yoktur.

   Döngü dört durumdan geçer ve her zaman bu sırayla:

     dinliyor → düşünüyor → konuşuyor → dinliyor …

   ─────────────────────────────────────────────────────────────────

   AKUSTİK GERİ BESLEME — bu katmanın en önemli kısıtı

   Koç konuşurken mikrofon AÇIK KALAMAZ. Kalırsa tanıyıcı koçun kendi
   sesini duyar, metne çevirir ve koç kendi cümlesine cevap vermeye
   başlar. Tarayıcının konuşma tanıma katmanında yankı engelleme
   yoktur.

   Doğrudan sonucu: SESLE SÖZ KESİLEMEZ. «Dur» diye bağırmak çalışmaz,
   çünkü o anda seni duyan kimse yok. Söz kesme dokunmayla olur: bir
   düğme ya da boşluk tuşu. Bu bir eksiklik değil, kısıtın dürüst
   karşılığıdır.

   ─────────────────────────────────────────────────────────────────

   DEĞİŞMEZ: ses ikinci bir yol açmaz.

   Sesli sohbet ekranın kendi gönderme yolundan geçer — yazarak
   sorduğun soruyla tamamen aynı yol: aynı brifing, aynı ev kuralları
   denetimi, aynı kayıt. Ses yalnızca GİRİŞ ve ÇIKIŞ biçimidir.

   R.Voice.speak() konuşmanın bittiğini haber verir ve üç tuzağı
   (uzun metin kesilmesi, gelmeyen onend, iptal) zaten kapatır;
   döngü onu bekleyerek ilerler. */

window.R = window.R || {};

R.Talk = (function(){

  /* Kullanıcı sustu mu? Tanıyıcı bunu söylemiyor; son metin
     değişiminden bu yana geçen süreyle karar veriyoruz.
     Adaptif bekleme: Cümle yarım kalmış gibi duruyorsa (ve, ama, çünkü, virgülden sonra)
     veya kullanıcı nefes alıyorsa 2.400 ms; soru veya net bitişse 1.500 ms; normalde 1.900 ms. */
  const SESSIZLIK_TABAN_MS = 1900;
  function sessizlikMs(metin){
    const s = String(metin || '').trim();
    if(!s) return SESSIZLIK_TABAN_MS;
    if(/[,;\-—]\s*$/.test(s) || /\b(ve|veya|çünkü|ama|fakat|lakin|yani|için|ile|de|da|ki)$/i.test(s)){
      return 2400;
    }
    if(/[.!?]\s*$/.test(s) || /\b(mı|mi|mu|mü|misin|musun|nedir|nasıl|kaç|hangi)\s*[?]?$/i.test(s)){
      return 1500;
    }
    return SESSIZLIK_TABAN_MS;
  }

  /* Koç sustuktan sonra mikrofonu açmadan önceki bekleme. Sıfır
     olursa tarayıcı bazen son heceyi mikrofona düşürüyor.
     350 ms: Windows/Chromium ses aygıtı kilidini tamamen bırakması için emniyetli eşik. */
  const SIRA_GECIS_MS = 350;

  let oturum = null;

  function snapshot(){
    if(!oturum) return { acik:false, durum:'kapalı', agentId:null, metin:'', hata:null };
    return { acik:!oturum.kapandi, durum:oturum.durum, agentId:oturum.agentId,
      metin:oturum.metin, hata:oturum.hata };
  }

  function durumaGec(yeni, ek){
    if(!oturum) return;
    oturum.durum = yeni;
    if(ek) Object.assign(oturum, ek);
    try{ oturum.onChange(snapshot()); }catch(e){}
  }

  function supported(){ return R.Listen && R.Listen.supported(); }
  /* Ses çıkışı olmadan da sohbet kurulabilir: sıra yine geçer, cevap
     yalnızca yazıyla görünür. Kullanıcıya bu SÖYLENİR. */
  function sesliCevapVar(){ return !!(R.Voice && R.Voice.available && R.Voice.available()); }

  /* ------------------------------------------------------ dinleme turu */

  function sessizlikSay(){
    if(!oturum) return;
    clearTimeout(oturum.saat);
    const ms = sessizlikMs(oturum.metin);
    oturum.saat = setTimeout(() => {
      if(!oturum || oturum.durum !== 'dinliyor') return;
      R.Listen.stop();          /* onEnd tetiklenir, tur orada kapanır */
    }, ms);
  }

  function dinle(){
    if(!oturum || oturum.kapandi) return;
    durumaGec('dinliyor', { metin:'', hata:null });

    R.Listen.start({
      continuous:true,
      onText(metin){
        if(!oturum || oturum.durum !== 'dinliyor') return;
        oturum.metin = metin;
        try{ oturum.onChange(snapshot()); }catch(e){}
        sessizlikSay();
      },
      onEnd(son){
        if(!oturum || oturum.kapandi) return;
        clearTimeout(oturum.saat);
        const soru = (son || oturum.metin || '').trim();
        if(!soru){
          /* Hiç konuşulmadı: döngü ölmez, yeniden dinler. */
          setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, SIRA_GECIS_MS);
          return;
        }
        cevapla(soru);
      },
      onError(kod){
        if(!oturum || oturum.kapandi) return;
        clearTimeout(oturum.saat);
        /* İzin sorunları döngüyü bitirir; geçici hatalar bitirmez. */
        if(kod === 'not-allowed' || kod === 'service-not-allowed' || kod === 'unsupported'){
          durumaGec('kapalı', { hata:R.Listen.message(kod) });
          stop();
          return;
        }
        durumaGec('dinliyor', { hata:R.Listen.message(kod) });
        setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, 500);
      },
    });
  }

  /* ------------------------------------------------------- cevap turu */

  async function cevapla(soru){
    if(!oturum || oturum.kapandi) return;
    const agentId = oturum.agentId;
    durumaGec('düşünüyor', { metin:soru });

    let cevap = '';
    try{
      /* Ekranın kendi gönderme yolu — ses ikinci bir kapı açmaz. */
      cevap = await oturum.gonder(soru);
    }catch(e){
      cevap = 'Cevap üretilemedi.';
    }
    if(!oturum || oturum.kapandi) return;

    if(!sesliCevapVar() || !cevap){
      setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, SIRA_GECIS_MS);
      return;
    }

    durumaGec('konuşuyor');
    let neden = 'end';
    try{
      neden = await R.Voice.speak(cevap, R.Voice.profileFor(agentId));
    }catch(e){ neden = 'error'; }
    if(!oturum || oturum.kapandi) return;

    /* Söz kesildiyse mikrofon HEMEN açılır: kesmişse söyleyecek bir
       şeyi var demektir. */
    const bekle = neden === 'cancelled' ? 0 : SIRA_GECIS_MS;
    setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, bekle);
  }

  /* ----------------------------------------------------------- denetim */

  /* `opts.gonder(soru)` ekranın kendi gönderme yoludur ve koçun
     CEVAP METNİNİ döndürmelidir. Döngü bu metni seslendirir. */
  function start(agentId, opts){
    const o = opts || {};
    if(!supported()) return { ok:false, reason:'unsupported',
      message:R.Listen ? R.Listen.message('unsupported') : 'Ses tanıma yok.' };
    if(typeof o.gonder !== 'function') return { ok:false, reason:'no-send' };
    stop();
    oturum = {
      agentId:agentId || 'patron', durum:'kapalı', metin:'', hata:null,
      saat:null, kapandi:false,
      gonder:o.gonder,
      onChange:o.onChange || function(){},
    };
    durumaGec('dinliyor');
    dinle();
    return { ok:true };
  }

  /* Sözü kes: koç susar, sıra hemen sana döner.
     Sesle değil DOKUNMAYLA — sebebi dosyanın başında. */
  function kes(){
    if(!oturum || oturum.kapandi) return false;
    if(oturum.durum !== 'konuşuyor') return false;
    try{ R.Voice.cancel(); }catch(e){}
    return true;
  }

  function stop(){
    const o = oturum;
    oturum = null;
    if(!o) return;
    o.kapandi = true;
    clearTimeout(o.saat);
    try{ R.Listen.stop(); }catch(e){}
    try{ R.Voice.cancel(); }catch(e){}
    try{ o.onChange({ acik:false, durum:'kapalı', agentId:o.agentId, metin:'', hata:o.hata }); }catch(e){}
  }

  function isActive(){ return !!(oturum && !oturum.kapandi); }
  function durum(){ return snapshot(); }

  return { supported, sesliCevapVar, start, stop, kes, isActive, durum,
    SESSIZLIK_TABAN_MS, SESSIZLIK_MS:SESSIZLIK_TABAN_MS, sessizlikMs, SIRA_GECIS_MS };
})();
