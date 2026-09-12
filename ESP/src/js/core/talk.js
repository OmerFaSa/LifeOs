/* SESLİ SOHBET — sıra alma döngüsü.

   Dikte ile sohbet arasındaki fark düğmedir. Dikte: mikrofona
   söylersin, alana yazılır, sen «Gönder»e basarsın, cevabı okursun.
   Sohbet: sen susarsın, sıra ajana geçer, o konuşur, susar, sıra
   sana döner. Arada düğme yoktur.

   Döngü dört durumdan geçer ve her zaman bu sırayla:

     dinliyor → düşünüyor → konuşuyor → dinliyor …

   ─────────────────────────────────────────────────────────────────

   AKUSTİK GERİ BESLEME — bu katmanın en önemli kısıtı

   Ajan konuşurken mikrofon AÇIK KALAMAZ. Kalırsa tanıyıcı ajanın
   kendi sesini duyar, metne çevirir ve ajan kendi cümlesine cevap
   vermeye başlar. Tarayıcının konuşma tanıma katmanında yankı
   engelleme yoktur.

   Bunun doğrudan sonucu: SESLE SÖZ KESİLEMEZ. «Dur» diye bağırmak
   çalışmaz, çünkü o anda seni duyan kimse yok.

   Söz kesme bu yüzden DOKUNMAYLA olur: bir düğme ya da boşluk tuşu.
   Ajan susar, mikrofon hemen açılır. Bu bir eksiklik değil, kısıtın
   dürüst karşılığıdır — sesle kesilebiliyormuş gibi yapmak, bağırıp
   cevap alamamaktan daha kötüdür.

   ─────────────────────────────────────────────────────────────────

   DEĞİŞMEZ: ses ikinci bir yol açmaz.

   Sesli sohbet `ESP.Office.send()` üzerinden geçer — yazarak sorduğun
   soruyla tamamen aynı yol. Aynı brifing, aynı ev kuralları denetimi,
   aynı kayıt. Ses yalnızca GİRİŞ ve ÇIKIŞ biçimidir; ayrı bir
   ayrıştırıcı, ayrı bir istem, ayrı bir kayıt yolu yoktur.

   Model kapalıyken de çalışır: kural motorunun cümlesi seslendirilir. */

window.ESP = window.ESP || {};

ESP.Talk = (function(){

  /* Kullanıcı sustu mu? Tanıyıcı bunu kendi söylemiyor; son metin
     değişiminden bu yana geçen süreyle karar veriyoruz.

     1.400 ms bilerek uzun: cümle ortasında düşünmek için bir saniye
     yetmiyor, iki saniye ise sohbeti ağırlaştırıyor. */
  const SESSIZLIK_MS = 1400;

  /* Ajan sustuktan sonra mikrofonu açmadan önceki bekleme. Sıfır
     olursa tarayıcı bazen konuşmanın son hecesini mikrofona
     düşürüyor. */
  const SIRA_GECIS_MS = 260;

  let oturum = null;

  function bosOturum(agentId, o){
    return {
      agentId,
      durum:'kapalı',        // kapalı | dinliyor | düşünüyor | konuşuyor
      metin:'',              // o anki duyulan metin (ara sonuç dahil)
      hata:null,
      sonCevap:null,
      sessizlikSaat:null,
      onChange:o.onChange || function(){},
      onTurn:o.onTurn || function(){},
      kapandi:false,
    };
  }

  function durumaGec(yeni, ek){
    if(!oturum) return;
    oturum.durum = yeni;
    if(ek) Object.assign(oturum, ek);
    try{ oturum.onChange(snapshot()); }catch(e){}
  }

  function snapshot(){
    if(!oturum) return { acik:false, durum:'kapalı', agentId:null, metin:'', hata:null };
    return {
      acik:!oturum.kapandi,
      durum:oturum.durum,
      agentId:oturum.agentId,
      metin:oturum.metin,
      hata:oturum.hata,
    };
  }

  function supported(){
    return ESP.Voice.supported();
  }
  /* Ses çıkışı olmadan da sohbet kurulabilir: sıra yine geçer, cevap
     yalnızca yazıyla görünür. Kullanıcıya bu SÖYLENİR. */
  function sesliCevapVar(){ return ESP.Speak.supported(); }

  /* ------------------------------------------------------ dinleme turu */

  function sessizlikSay(){
    if(!oturum) return;
    clearTimeout(oturum.sessizlikSaat);
    oturum.sessizlikSaat = setTimeout(() => {
      if(!oturum || oturum.durum !== 'dinliyor') return;
      ESP.Voice.stop();          /* onEnd tetiklenir, tur orada kapanır */
    }, SESSIZLIK_MS);
  }

  function dinle(){
    if(!oturum || oturum.kapandi) return;
    durumaGec('dinliyor', { metin:'', hata:null });

    ESP.Voice.start({
      continuous:true,
      onText(text){
        if(!oturum || oturum.durum !== 'dinliyor') return;
        oturum.metin = text;
        try{ oturum.onChange(snapshot()); }catch(e){}
        sessizlikSay();
      },
      onEnd(final){
        if(!oturum || oturum.kapandi) return;
        clearTimeout(oturum.sessizlikSaat);
        const soru = (final || oturum.metin || '').trim();
        if(!soru){
          /* Hiç konuşulmadı: döngü ölmez, yeniden dinler. */
          setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, SIRA_GECIS_MS);
          return;
        }
        cevapla(soru);
      },
      onError(code){
        if(!oturum || oturum.kapandi) return;
        clearTimeout(oturum.sessizlikSaat);
        /* İzin sorunları döngüyü bitirir; geçici hatalar bitirmez. */
        if(code === 'not-allowed' || code === 'service-not-allowed' || code === 'unsupported'){
          durumaGec('kapalı', { hata:ESP.Voice.message(code) });
          stop();
          return;
        }
        durumaGec('dinliyor', { hata:ESP.Voice.message(code) });
        setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, 500);
      },
    });
  }

  /* ------------------------------------------------------- cevap turu */

  async function cevapla(soru){
    if(!oturum || oturum.kapandi) return;
    const agentId = oturum.agentId;
    durumaGec('düşünüyor', { metin:soru });
    try{ oturum.onTurn({ role:'user', text:soru }); }catch(e){}

    let res;
    try{
      /* Yazarak sorulan soruyla AYNI yol: aynı brifing, aynı denetim,
         aynı kayıt. */
      res = await ESP.Office.send(agentId, soru);
    }catch(e){
      res = { text:'Cevap üretilemedi.', source:'rules', error:String(e && e.message || e) };
    }
    if(!oturum || oturum.kapandi) return;

    oturum.sonCevap = res;
    try{ oturum.onTurn({ role:'agent', text:res.text, source:res.source }); }catch(e){}

    if(!sesliCevapVar()){
      /* Ses çıkışı yok: sıra yine geçer, cevap yazıyla okunur. */
      setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, SIRA_GECIS_MS);
      return;
    }

    durumaGec('konuşuyor');
    const sonuc = await ESP.Speak.say(res.text, { agent:agentId });
    if(!oturum || oturum.kapandi) return;

    /* Söz kesildiyse mikrofon HEMEN açılır: kullanıcı kesmişse
       söyleyecek bir şeyi var demektir. */
    const bekle = sonuc.iptal ? 0 : SIRA_GECIS_MS;
    setTimeout(() => { if(oturum && !oturum.kapandi) dinle(); }, bekle);
  }

  /* ----------------------------------------------------------- denetim */

  function start(agentId, opts){
    const o = opts || {};
    if(!supported()) return { ok:false, reason:'unsupported',
      message:ESP.Voice.message('unsupported') };
    stop();
    oturum = bosOturum(agentId || 'patron', o);
    durumaGec('dinliyor');
    dinle();
    return { ok:true };
  }

  /* Sözü kes: ajan susar, sıra hemen sana döner.

     Sesle değil DOKUNMAYLA çalışır — sebebi dosyanın başında. */
  function kes(){
    if(!oturum || oturum.kapandi) return false;
    if(oturum.durum !== 'konuşuyor') return false;
    ESP.Speak.stop();
    return true;
  }

  function stop(){
    const o = oturum;
    oturum = null;
    if(!o) return;
    o.kapandi = true;
    clearTimeout(o.sessizlikSaat);
    try{ ESP.Voice.stop(); }catch(e){}
    try{ ESP.Speak.stop(); }catch(e){}
    o.durum = 'kapalı';
    try{ o.onChange({ acik:false, durum:'kapalı', agentId:o.agentId, metin:'', hata:o.hata }); }catch(e){}
  }

  function isActive(){ return !!(oturum && !oturum.kapandi); }
  function durum(){ return snapshot(); }
  function agent(){ return oturum ? oturum.agentId : null; }

  return {
    supported, sesliCevapVar,
    start, stop, kes, isActive, durum, agent,
    SESSIZLIK_MS, SIRA_GECIS_MS,
  };
})();
