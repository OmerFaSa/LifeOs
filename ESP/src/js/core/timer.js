/* Pratik zamanlayıcısı — süreyi ÖLÇER, tahmin ettirmez.

   Sistem baştan beri «süre ölçümdür» diyor ama ölçecek bir şey vermiyordu:
   kullanıcı saatine bakıp dakikayı elle yazıyordu. Elle yazılan dakika da
   bir ölçümdür (saate bakmak ölçmektir) ama iki maliyeti var — başlarken
   saate bakmayı hatırlamak, bitirirken çıkarma yapmak. İkisi de unutulur
   ve unutulan oturum hiç girilmez.

   Üç karar bu dosyayı yönetir:

   1. SÜRE DUVAR SAATİNDEN GELİR, tik sayısından değil. Arka plan sekmesinde
      `setInterval` durur ya da yavaşlar; sayarak ölçen bir zamanlayıcı
      telefonda her seferinde eksik ölçer. Burada yalnızca BAŞLANGIÇ ANI
      saklanır, geçen süre her okumada `Date.now()` farkıyla hesaplanır.

   2. ZAMANLAYICI SAYFAYI KAPATINCA ÖLMEZ. Depoya yazılır; sekme kapanıp
      açılsa da sayaç yerinde durur. Yarım kalan bir ölçüm, hiç yapılmamış
      bir ölçümden beterdir — kullanıcı çalıştığını sanır, kayıt yoktur.

   3. UNUTULAN ZAMANLAYICI KAYIT ÜRETMEZ. Altı saati geçen bir sayaç
      «şüpheli» işaretlenir: sistem 9 saatlik bir oturumu sessizce
      kaydetmez, kullanıcıya sorar. Uydurulmuş büyük bir sayı, hiç sayı
      olmamasından kötüdür — bu depodaki en eski kural. */

window.ESP = window.ESP || {};

ESP.Timer = (function(){
  const U = ESP.U, S = ESP.S;

  /* Bu süreyi aşan sayaç kendiliğinden kaydedilmez. Altı saat, tek
     oturumda gerçekten çalışılabilecek üst sınırın epey üstünde. */
  const SUPHE_SAAT = 6;
  const SUPHE_MS = SUPHE_SAAT * 60 * 60 * 1000;

  function now(){ return Date.now(); }

  function bos(){
    return { disc:null, startedAt:null, accumulatedMs:0, running:false, at:null };
  }

  function state(){
    if(!S.timer) S.timer = bos();
    return S.timer;
  }

  /* Geçen süre: biriken + (çalışıyorsa şu ana kadar geçen). */
  function elapsedMs(t){
    const x = t || state();
    const canli = (x.running && x.startedAt) ? Math.max(0, now() - x.startedAt) : 0;
    return (x.accumulatedMs || 0) + canli;
  }

  function minutes(t){ return Math.round(elapsedMs(t) / 60000); }

  function running(){ return !!state().running; }
  function active(){ const t = state(); return !!(t.disc && (t.running || t.accumulatedMs)); }
  function disc(){ return state().disc; }

  /* Şüpheli mi? Altı saati geçen sayaç muhtemelen unutulmuştur. */
  function suspicious(t){ return elapsedMs(t) > SUPHE_MS; }

  function clock(t){
    const ms = elapsedMs(t);
    const sn = Math.floor(ms / 1000);
    const dk = Math.floor(sn / 60), s = sn % 60;
    const sa = Math.floor(dk / 60), d = dk % 60;
    const iki = n => (n < 10 ? '0' : '') + n;
    return sa ? (sa + ':' + iki(d) + ':' + iki(s)) : (iki(d) + ':' + iki(s));
  }

  async function save(){
    await ESP.Store.set('timer', state());
    return state();
  }

  /* Başlat. Başka bir disiplin çalışıyorsa önce o durdurulur ve süresi
     KAYBOLMAZ — çağırana geri verilir. */
  async function start(discId){
    const d = (ESP.DISCIPLINE_BY_ID || {})[discId] ? discId : null;
    if(!d) return { ok:false, error:'Bilinmeyen bölüm.' };
    if(!ESP.Mod.isOn(d)) return { ok:false, error:'Bu bölüm kapalı.' };

    const t = state();
    let devreden = null;
    if(t.disc && t.disc !== d && (t.running || t.accumulatedMs)){
      devreden = { disc:t.disc, minutes:minutes(t) };
    }
    S.timer = { disc:d, startedAt:now(), accumulatedMs:0, running:true,
      at:new Date().toISOString() };
    await save();
    return { ok:true, handedOver:devreden };
  }

  async function pause(){
    const t = state();
    if(!t.running) return { ok:false, error:'Zamanlayıcı zaten duruyor.' };
    t.accumulatedMs = elapsedMs(t);
    t.running = false;
    t.startedAt = null;
    await save();
    return { ok:true, minutes:minutes(t) };
  }

  async function resume(){
    const t = state();
    if(t.running) return { ok:false, error:'Zamanlayıcı zaten çalışıyor.' };
    if(!t.disc) return { ok:false, error:'Açık zamanlayıcı yok.' };
    t.startedAt = now();
    t.running = true;
    await save();
    return { ok:true };
  }

  async function reset(){
    S.timer = bos();
    await save();
    return { ok:true };
  }

  /* Bitir ve gün kaydına yaz.

     Bir dakikanın altındaki sayaç kaydedilmez: "0 dakika oturum" diye bir
     şey yok ve sıfır yazmak, girilmemiş günü girilmiş göstermektir.

     Şüpheli sayaç da kendiliğinden yazılmaz; çağıran taraf `force` ile
     ısrar edebilir ama o zaman kullanıcı ne kaydettiğini görmüş olur. */
  async function stop(opts){
    const o = opts || {};
    const t = state();
    if(!t.disc) return { ok:false, error:'Açık zamanlayıcı yok.' };

    const dk = o.minutes != null ? o.minutes : minutes(t);
    if(!(dk >= 1)){
      await reset();
      return { ok:false, error:'Bir dakikanın altındaki sayaç kaydedilmez.',
        discarded:true };
    }
    if(suspicious(t) && !o.force){
      return { ok:false, suspicious:true, minutes:dk,
        error:SUPHE_SAAT + ' saatten uzun bir sayaç muhtemelen unutuldu. '
          + 'Süreyi kendin yazabilir ya da ısrar edebilirsin.' };
    }

    const s = await ESP.Model.addSession(o.date || U.todayISO(), {
      disc:t.disc, minutes:dk, count:o.count != null ? o.count : null,
      note:o.note || 'zamanlayıcı',
    });
    const disc = t.disc;
    await reset();
    if(ESP.Memo && ESP.Memo.bitir) ESP.Memo.bitir();
    return { ok:true, session:s, minutes:dk, disc:disc };
  }

  /* Yüklemede geri al. Çalışır durumda kaydedilmiş bir sayaç, sekme
     kapalıyken de akmaya devam etmiş sayılır: duvar saati böyle işler. */
  async function load(){
    const kayit = await ESP.Store.get('timer');
    S.timer = Object.assign(bos(), kayit || {});
    /* Bozuk kayıt sessizce hayatta kalmaz. */
    if(typeof S.timer.accumulatedMs !== 'number' || !isFinite(S.timer.accumulatedMs)){
      S.timer.accumulatedMs = 0;
    }
    if(S.timer.running && typeof S.timer.startedAt !== 'number'){
      S.timer.running = false; S.timer.startedAt = null;
    }
    if(S.timer.disc && !(ESP.DISCIPLINE_BY_ID || {})[S.timer.disc]) S.timer = bos();
    return S.timer;
  }

  return { SUPHE_SAAT, start, pause, resume, stop, reset, load,
    elapsedMs, minutes, clock, running, active, disc, suspicious, state };
})();
