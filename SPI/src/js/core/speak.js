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

  /* --------------------------------------------------------- söyleme

     Web Speech API'nin iki tuzağı buraya yazılı. İkisi de AYS'nin ses
     katmanında zor yoldan öğrenilmiş ve aynısı burada da geçerli:

     a) UZUN METİN SESSİZCE KESİLİR. Chrome yaklaşık 15 saniye sonra
        konuşmayı durdurur ve `onend` hiç gelmez. Dört cümlelik bir
        ajan cevabı tam olarak bu sınıra girer. Metin cümlelere
        bölünüp parça parça okunur; her parça kısadır.

     b) `onend` HİÇ GELMEYEBİLİR — sekme arka plana atılır, ses aygıtı
        düşer. Burası kritik: sıra alma döngüsü konuşmanın bitmesini
        BEKLİYOR. Söz çözülmezse mikrofon bir daha açılmaz ve kullanıcı
        neden cevap alamadığını anlamaz. Her parçaya uzunluğuna göre
        bir emniyet süresi konur; süre dolarsa konuşma bitmiş sayılır.

     Sonuç: `say()` HİÇBİR KOŞULDA asılı kalmaz. */

  const PARCA = 180;                 /* bir parçanın en fazla uzunluğu */
  const DUR = '.!?…:;';              /* cümle sonu sayılan noktalama */

  /* Cümlelere böler. «14,5 ng/mL» gibi sayıların içindeki nokta cümle
     sonu sayılmaz: noktalamadan sonra boşluk ya da metin sonu aranır. */
  function cumleler(s){
    const out = [];
    let bas = 0;
    for(let i = 0; i < s.length; i++){
      if(DUR.indexOf(s[i]) < 0) continue;
      let j = i;
      while(j + 1 < s.length && DUR.indexOf(s[j + 1]) >= 0) j++;
      const sonraki = s[j + 1];
      if(sonraki === undefined || /\s/.test(sonraki)){
        const p = s.slice(bas, j + 1).trim();
        if(p) out.push(p);
        bas = j + 1;
      }
      i = j;
    }
    const kuyruk = s.slice(bas).trim();
    if(kuyruk) out.push(kuyruk);
    return out;
  }

  /* Cümleleri PARCA sınırına kadar birleştirir; tek başına uzun olan
     cümle kelime sınırından bölünür. */
  function parcala(text){
    const s = String(text || '').trim();
    if(!s) return [];
    const out = [];
    const liste = cumleler(s).length ? cumleler(s) : [s];
    let tampon = '';
    liste.forEach(ham => {
      let p = ham.trim();
      if(!p) return;
      while(p.length > PARCA){
        const kes = p.lastIndexOf(' ', PARCA);
        const at = kes > PARCA * 0.5 ? kes : PARCA;
        if(tampon){ out.push(tampon); tampon = ''; }
        out.push(p.slice(0, at).trim());
        p = p.slice(at).trim();
      }
      if((tampon + ' ' + p).trim().length > PARCA){ out.push(tampon); tampon = p; }
      else tampon = (tampon ? tampon + ' ' : '') + p;
    });
    if(tampon) out.push(tampon);
    return out.filter(Boolean);
  }

  /* Emniyet süresi. Yavaş bir sesin saniyede ~10 karakter okuduğu
     varsayılır; üstüne üç saniye pay konur ve 45 saniyede tavanlanır. */
  function emniyetMs(text, rate){
    const r = Math.max(0.5, Number(rate) || 1);
    return Math.min(45000, 3000 + (String(text).length / (10 * r)) * 1000);
  }

  let simdiki = null;      /* { agentId, iptal } */

  function parcaSoyle(metin, ayar){
    return new Promise(resolve => {
      let bitti = false, saat = null;
      const bitir = neden => {
        if(bitti) return;
        bitti = true;
        clearTimeout(saat);
        resolve(neden);
      };

      let u;
      try{ u = new Utter(metin); }
      catch(e){ return bitir('hata'); }

      if(ayar.voice){ u.voice = ayar.voice; u.lang = ayar.voice.lang; }
      else u.lang = ayar.lang || 'tr-TR';
      u.rate = ayar.rate;
      u.pitch = ayar.pitch;
      u.volume = ayar.volume;

      u.onend = () => bitir('bitti');
      u.onerror = ev => {
        const kod = (ev && ev.error) || 'hata';
        bitir(kod === 'interrupted' || kod === 'canceled' ? 'iptal' : 'hata');
      };

      /* `onend` hiç gelmezse burası gelir; çağıran asılı kalmaz. */
      saat = setTimeout(() => bitir('zamanasimi'), emniyetMs(metin, u.rate));

      try{ API.speak(u); }
      catch(e){ bitir('hata'); }
    });
  }

  /* Bir cümleyi söyler ve BİTİNCE çözülen bir söz döndürür.

     Sözün bitmesi sıra alma döngüsünün tek tetikleyicisidir: mikrofon
     ancak ajan sustuğunda açılır. Bu yüzden hata, iptal ya da zaman
     aşımı — hepsinde söz MUTLAKA çözülür. */
  async function say(text, opts){
    const o = opts || {};
    const metin = konusulacak(text);
    if(!supported() || !metin) return { ok:false, reason:'bos' };

    const parcalar = parcala(metin);
    if(!parcalar.length) return { ok:false, reason:'bos' };

    stop();

    const stil = styleFor(o.agent);
    const ayar = {
      voice:o.voice || voiceFor(o.agent),
      lang:o.lang,
      rate:o.rate != null ? o.rate : stil.rate,
      pitch:o.pitch != null ? o.pitch : stil.pitch,
      volume:o.volume != null ? o.volume : 1,
    };

    simdiki = { agentId:o.agent || null };
    if(o.onStart) o.onStart();

    let zamanasimi = false;
    for(let i = 0; i < parcalar.length; i++){
      if(!simdiki) return { ok:false, reason:'iptal', iptal:true };
      const neden = await parcaSoyle(parcalar[i], ayar);
      if(neden === 'iptal'){ simdiki = null; return { ok:false, reason:'iptal', iptal:true }; }
      if(neden === 'hata'){ simdiki = null; return { ok:false, reason:'hata' }; }
      if(neden === 'zamanasimi') zamanasimi = true;
    }
    simdiki = null;
    return { ok:true, zamanasimi };
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
    parcala, cumleler, emniyetMs,
    KIMLIK, PARCA,
  };
})();
