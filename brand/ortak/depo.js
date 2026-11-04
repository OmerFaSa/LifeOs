/* DEPO — modüllerin kalıcı depolama katmanı (tek kaynak).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/depo.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Modülün
   `core/store.js`'i yalnız kendi ayarlarıyla `LIFEOS.Depo.kur(...)` çağırır.

   NEDEN (2026-11-01, KING-4 Ölçüm 2c): üç `store.js` (~520 satır) ad alanı,
   anahtar ve metin dışında aynıydı ve ayrışmaya başlamıştı: AYS bulut
   listesini yerel kopyaya satır başına yazıyordu (SPİ ve ESP tek yazma),
   `activeProfileId` yalnız ESP'deydi.

   Ayarlar (o):
     ns               modülün ad alanı (SCHEMA_VERSION buradan okunur)
     profilAnahtari   etkin profilin localStorage anahtarı
     varsayilanProfil anahtar yoksa profil
     appId            yedeğin kimliği
     yerelAnahtar(p)  profilin localStorage anahtarı
     ad               kullanıcıya görünen ad («SPİ», «Rota», «ESP»)
     alan             eşitleme alanı öneki («spi», «ays», «esp»)
     veriYeri         kota uyarısında yedeğin alındığı yer

   Kalıcı depolama:
   Once Artifact "db" yetenegi denenir (cihazlar arasi), yoksa localStorage'a duser.
   Her iki durumda da yerel kopya tutulur; boylece cevrimdisi calisir.
   Hatalar yutulmaz: onError kancasi uzerinden arayuze bildirilir. */
window.LIFEOS.PARCA.yazilar({
  'ortak.depo.yerel-kayit-okunamadi-verile':'Yerel kayıt okunamadı; veriler geçici olarak bellekte tutuluyor.',
  'ortak.depo.tarayici-depolama-alani-dold':'Tarayıcı depolama alanı doldu. ',
  'ortak.depo.degisiklik-bu-cihaza-kaydedi':'Değişiklik bu cihaza kaydedilemedi.',
  'ortak.depo.hesaba-bagli-senkronizasyon':'Hesaba bağlı senkronizasyon açılamadı; uygulama bu cihazda çalışmaya devam ediyor.',
  'ortak.depo.buluttan-okunamadi-bu-cihazd':'Buluttan okunamadı; bu cihazdaki kopya kullanılıyor.',
  'ortak.depo.degisiklik-bu-cihaza-kaydedi-2':'Değişiklik bu cihaza kaydedildi ama buluta gönderilemedi. Bağlantı gelince tekrar dene.',
  'ortak.depo.degisiklik-kaydedilemedi':'Değişiklik kaydedilemedi.',
  'ortak.depo.kayit-buluttan-silinemedi':'Kayıt buluttan silinemedi.',
  'ortak.depo.bulut-verisi-okunamadi-bu-ci':'Bulut verisi okunamadı; bu cihazdaki kopya kullanılıyor.',
  'ortak.depo.dosya-okunamadi':'Dosya okunamadı.',
  'ortak.depo.bu-yedek-baska-bir-uygulamad':'Bu yedek başka bir uygulamadan («',
  'ortak.depo.yedek-govdesi-okunamadi':'Yedek gövdesi okunamadı.',
  'ortak.depo.bu-yedek-daha-yeni-bir':'Bu yedek daha yeni bir sürümle alınmış (şema ',
  'ortak.depo.bu-dosya-bir':'Bu dosya bir ',
});


window.LIFEOS = window.LIFEOS || {};

LIFEOS.Depo = Object.freeze({ kur(o){
  /* Hane halki: her profil kendi anahtarinda durur. Tahlil ve olcum verisi
     profiller arasinda karismaz; 'ben' varsayilan birincil profildir. */
  function activeProfile(){
    try{ return localStorage.getItem(o.profilAnahtari) || o.varsayilanProfil; }
    catch(e){ return o.varsayilanProfil; }
  }
  const PROFILE = activeProfile();
  /* Yedegin kimligi — disa aktarirken yazilir, geri yuklerken ARANIR.
     Iki yerde ayri ayri yazilan bir kimlik, bir gun ayrisir. */
  const APP_ID = o.appId;

  const LOCAL_KEY = o.yerelAnahtar(PROFILE);
  /* Yedekten yukleme ONCESI durumun tek yuvalik kopyasi. LOCAL_KEY'in
     GOVDESINE degil, AYRI bir anahtara yazilir: importAll o anahtari
     ezmedigi icin geri alma imkani import'un kendisinden hayatta kalir. */
  const UNDO_KEY = LOCAL_KEY + '.oncesi';
  let db = null;
  let mode = 'local';

  const health = {
    cloud:'off',        // 'off' | 'ok' | 'error'
    local:'ok',         // 'ok' | 'error'
    lastError:null,     // { scope, code, message, at }
    pendingCloudWrites:0,
  };

  let onError = null;   // app.js tarafindan baglanir

  function report(scope, err, userMessage){
    const code = (err && err.code) || (err && err.name) || 'unknown';
    health.lastError = {
      scope, code,
      message: userMessage || (err && err.message) || String(err),
      at: new Date().toISOString(),
    };
    console.error('[Store:'+scope+']', err);
    if(typeof onError === 'function'){
      try{ onError(health.lastError, health); }catch(e){}
    }
  }

  function isQuotaError(e){
    if(!e) return false;
    return e.name === 'QuotaExceededError'
      || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || e.code === 22 || e.code === 1014
      || /quota|storage.*full/i.test(e.message || '');
  }

  /* ---------- ayrıştırılmış kopya ----------

     HER YAZMA TÜM DEPOYU AYRIŞTIRIYORDU. `lSet` önce `localAll()` ile
     bütün kaydı JSON'dan çözüyor, tek anahtarı değiştirip yeniden
     serileştiriyordu; yani bir ölçüm girmenin maliyeti, o güne kadar
     girilmiş HER ŞEYİN boyutuyla büyüyordu.

     Ölçüldü: 50 kayıtta yazma başına 0,17 ms, 1000 kayıtta 5,00 ms —
     yirmi dokuz kat. Dokuz aylık kullanımda (günde ~10 kayıt) her
     dokunuş fark edilir bir gecikmeye dönüşürdü.

     Çözüm ayrıştırılmış kopyayı bellekte tutmaktır. Serileştirme
     KALIR — yazma yine anında diske iner, ertelenmez. Ertelenen bir
     yazma, sekmesini kapatan kullanıcının verisini kaybeder ve burası
     verinin kaybolabileceği tek yerdir; hız için o riski almayız.

     Kopya BAŞKA BİR SEKME yazdığında geçersizleşir: `storage` olayı
     yalnızca diğer sekmelerde tetiklenir, tam da bize gereken şey. */
  let kopya = null;

  function localAll(){
    if(kopya) return kopya;
    try{
      kopya = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
      return kopya;
    }catch(e){
      report('local-read', e, yz('ortak.depo.yerel-kayit-okunamadi-verile'));
      health.local = 'error';
      kopya = {};
      return kopya;
    }
  }

  let onExternalWrite = null;   // app.js tarafından bağlanır

  /* Başka sekme yazdıysa bellekteki kopya eskimiştir.

     ÖNCE YALNIZ `kopya` (bu dosyanın HAM JSON önbelleği) sıfırlanıyordu.
     Ama uygulamanın BELLEKTEKİ MODELİ (`X.S` gibi)
     ayrı bir katmandır ve `kopya = null` onu HİÇ etkilemez — yalnız bir
     SONRAKİ `localAll()` çağrısında diskten yeniden okunacağını sağlar.
     İki sekme aynı günü düzenlerse: B sekmesi yazar, A sekmesinin
     bellekteki modeli BAYAT KALIR; A sonra kendi (bayat) kopyasını
     kaydederse B'nin değişikliği SESSİZCE ezilir.

     Tam bir birleştirme bu katmanda YAPILMAZ — ama sessizce ezilmesi de
     kabul edilebilir değil. `onExternalWrite` app.js'te bir uyarıya
     bağlanır; kullanıcı sayfayı yenileyip GÜNCEL veriyi görebilir. */
  try{
    window.addEventListener('storage', e => {
      if(!e || e.key === null || e.key === LOCAL_KEY){
        kopya = null;
        if(typeof onExternalWrite === 'function'){
          try{ onExternalWrite(); }catch(err){}
        }
      }
    });
  }catch(e){ /* olay bağlanamadıysa kopya yalnız bu sekmede yaşar */ }
  function localWrite(all){
    kopya = all;
    try{
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
      if(health.local === 'error'){ health.local = 'ok'; }
      return true;
    }catch(e){
      health.local = 'error';
      report('local-write', e, isQuotaError(e)
        ? yz('ortak.depo.tarayici-depolama-alani-dold') + o.veriYeri + ' bölümünden yedek alıp eski kayıtları temizle.'
        : yz('ortak.depo.degisiklik-bu-cihaza-kaydedi'));
      return false;
    }
  }

  function lGet(path){
    const all = localAll();
    return all[path] === undefined ? null : all[path];
  }
  function lSet(path, data){
    const all = localAll();
    all[path] = data;
    return localWrite(all);
  }
  function lDel(path){
    const all = localAll();
    delete all[path];
    localWrite(all);
  }
  /* Birden çok yolu TEK yazmayla kaydeder.

     Bulut listesi geldiğinde her satır ayrı ayrı `lSet` ile yazılıyordu:
     yüz kayıtlık bir koleksiyon, yüz kez tam serileştirme demekti. */
  function lSetMany(pairs){
    if(!pairs.length) return true;
    const all = localAll();
    pairs.forEach(([path, data]) => { all[path] = data; });
    return localWrite(all);
  }

  function lList(prefix){
    const all = localAll();
    const p = prefix.endsWith('/') ? prefix : prefix + '/';
    const out = [];
    Object.keys(all).forEach(k => {
      if(k.indexOf(p) === 0){
        const rest = k.slice(p.length);
        if(rest && rest.indexOf('/') === -1) out.push(Object.assign({ id:rest }, all[k]));
      }
    });
    return out;
  }

  /* ---------- eşitleme kancası (brand/ortak/hesap.js) ----------
     Her yazma hangi yolun değiştiğini hesap katmanına bildirir; hesap
     yolu sıraya yazar ve PC sunucusuna ulaşınca gönderir. Uzaktan gelen
     kayıt `uzaktan` ile yazılır ve BİLDİRİLMEZ (geri gönderilmez). Cihaza
     ait anahtarlar (CIHAZA_AIT: HKM jetonu, depo ve kullanım ölçümü) eşitlenmez. */
  let onDegisim = null;
  function degisti(yollar){
    const y = (yollar || []).filter(p => CIHAZA_AIT.indexOf(p) < 0);
    if(!y.length) return;
    /* Kaydet dokunuşu (brand/ortak/hareket.js) gerçekten yazıldığını bilsin. */
    try{ window.dispatchEvent(new CustomEvent('lifeos:kayit', { detail:{ yollar:y } })); }catch(e){ /* olay yok */ }
    if(typeof onDegisim !== 'function') return;
    try{ onDegisim(y); }catch(e){ console.error('[Store:esitle]', e); }
  }
  function hepsi(){ return cihazsiz(localAll()); }
  function uzaktan(ciftler){
    const all = localAll();
    (ciftler || []).forEach(c => {
      const y = c && c[0], d = c && c[1];
      if(typeof y !== 'string' || !y || CIHAZA_AIT.indexOf(y) >= 0) return;
      if(d === null || d === undefined) delete all[y]; else all[y] = d;
    });
    return localWrite(all);
  }

  async function init(){
    try{
      if(window.claude && typeof window.claude.use === 'function'){
        const api = await window.claude.use('db');
        if(api){ db = api; mode = 'cloud'; health.cloud = 'ok'; }
      }
    }catch(e){
      db = null;
      health.cloud = 'error';
      report('cloud-init', e, yz('ortak.depo.hesaba-bagli-senkronizasyon'));
    }
    try{
      if(typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function'){
        navigator.storage.persist().then(function(granted){
          health.persisted = !!granted;
        }).catch(function(){});
      }
    }catch(e){}
    return mode;
  }

  async function get(path){
    if(db){
      try{
        const snap = await db.doc(path).get();
        health.cloud = 'ok';
        if(snap.exists){
          const data = snap.data();
          lSet(path, data);
          return data;
        }
        return lGet(path);
      }catch(e){
        health.cloud = 'error';
        report('cloud-read', e, yz('ortak.depo.buluttan-okunamadi-bu-cihazd'));
        return lGet(path);
      }
    }
    return lGet(path);
  }

  async function set(path, data){
    const localOk = lSet(path, data);
    /* Yazılamayan kayıt «kaydedildi» olayı üretmez (kota dolu). */
    if(localOk) degisti([path]);
    if(db){
      health.pendingCloudWrites++;
      try{
        await db.doc(path).set(data);
        health.cloud = 'ok';
      }catch(e){
        health.cloud = 'error';
        report('cloud-write', e, localOk
          ? yz('ortak.depo.degisiklik-bu-cihaza-kaydedi-2')
          : yz('ortak.depo.degisiklik-kaydedilemedi'));
      }finally{
        health.pendingCloudWrites--;
      }
    }
    return localOk;
  }

  async function remove(path){
    lDel(path);
    degisti([path]);
    if(db){
      try{ await db.doc(path).delete(); }
      catch(e){
        health.cloud = 'error';
        report('cloud-delete', e, yz('ortak.depo.kayit-buluttan-silinemedi'));
      }
    }
  }

  async function list(collection){
    if(db){
      try{
        const snap = await db.collection(collection).get();
        health.cloud = 'ok';
        const rows = snap.docs.map(d => Object.assign({ id:d.id }, d.data()));
        lSetMany(rows.map(r => [collection+'/'+r.id, r]));
        if(rows.length) return rows;
        return lList(collection);
      }catch(e){
        health.cloud = 'error';
        report('cloud-list', e, yz('ortak.depo.bulut-verisi-okunamadi-bu-ci'));
        return lList(collection);
      }
    }
    return lList(collection);
  }

  /* ---------- yedekleme ---------- */

  /* CIHAZA AIT anahtarlar yedege girmez, yedekten de gelmez.

     `hkm`: HKM adresi, acik/kapali durumu ve Bearer JETONU. Yedek
     dosyasi e-postaya, buluta, baska bir diske gider; jeton oraya duz
     metin girmemeli. Geri yukleme de baska bir cihazin (ya da eski bir
     donemin) «acik» ayarini sormadan geri getirmemeli: bu cihazin
     ayari neyse o kalir, hic kurulmamissa kurulmamis kalir.

     `storage`: BU tarayicinin deposunun boyut defteri (core/storage.js,
     her acilista bir ornek). Baska bir cihazin olcumu bu deponun buyume
     hizini bozar. Eslenirken her acilis oteki cihazlara «degisiklik» diye
     gidiyor, o cihaz da yenilerken kendi olcumunu yaziyordu: iki acik
     cihaz birbirini durmadan yeniletti (hesap.js, 2026-10-05). */
  const CIHAZA_AIT = ['hkm', 'storage', 'usage'];
  function cihazsiz(data){
    const out = Object.assign({}, data);
    CIHAZA_AIT.forEach(k => { delete out[k]; });
    return out;
  }

  function exportAll(){
    return {
      __meta:{
        app:APP_ID,
        schemaVersion:o.ns.SCHEMA_VERSION,
        exportedAt:new Date().toISOString(),
        mode,
      },
      data:cihazsiz(localAll()),
    };
  }

  /* Hem yeni ({__meta,data}) hem eski (duz sozluk) bicimi kabul eder. */
  function readBackup(obj){
    if(!obj || typeof obj !== 'object') return { ok:false, error:yz('ortak.depo.dosya-okunamadi') };
    if(obj.__meta && obj.data){
      /* UYGULAMA KIMLIGI once denetlenir. Yalniz sema surumune bakan bir
         okuma, baska bir LifeOS uygulamasinin yedegini kabul ediyordu:
         dosya secicide yanlis dosyayi secmek, profil verisinin baska bir
         uygulamanin verisiyle degismesi demekti. */
      if(obj.__meta.app && obj.__meta.app !== APP_ID){
        return { ok:false, error:yz('ortak.depo.bu-yedek-baska-bir-uygulamad')
          + String(obj.__meta.app).slice(0, 32) + '»). ' + o.ad + ' yedeği gerekir.' };
      }
      if(typeof obj.data !== 'object' || Array.isArray(obj.data)){
        return { ok:false, error:yz('ortak.depo.yedek-govdesi-okunamadi') };
      }
      if(obj.__meta.schemaVersion > o.ns.SCHEMA_VERSION){
        return { ok:false, error:yz('ortak.depo.bu-yedek-daha-yeni-bir')+obj.__meta.schemaVersion+'). Önce uygulamayı güncelle.' };
      }
      return { ok:true, data:obj.data, meta:obj.__meta };
    }
    const keys = Object.keys(obj);
    const looksLegacy = keys.some(k => k.indexOf('/') > 0);
    if(!looksLegacy) return { ok:false, error:yz('ortak.depo.bu-dosya-bir') + o.ad + ' yedeği değil.' };
    return { ok:true, data:obj, meta:{ schemaVersion:1, legacy:true } };
  }

  async function importAll(obj){
    const parsed = readBackup(obj);
    if(!parsed.ok) throw new Error(parsed.error);

    /* USTUNE YAZMADAN ONCE tek yuvalik bir geri donus kopyasi birakilir.
       Dosya secicide YANLIS AMA GECERLI bir yedek secmek — baska bir
       profilin ya da eski bir donemin yedegi — bu depodaki geri donussuz
       tek islemdi. Yazma basarisiz olursa (kota dolu) geri alma imkani
       sessizce kaybolur ama import yine de denenir: hic geri alamamak,
       hic import edememekten daha az kotudur. */
    /* Kopya yazilamazsa ONCEKI ice aktarmanin kopyasi da silinir: kalsaydi
       «geri al» haftalar onceki duruma donup aradaki butun kaydi silerdi
       (belgeler/ekip/HATALAR.md O-3). Sonuc bu ice aktarmanin geri alinamayacagini
       soyler. */
    let geriAlinamaz = false;
    try{
      localStorage.setItem(UNDO_KEY, JSON.stringify({ at:new Date().toISOString(), data:localAll() }));
    }catch(e){
      geriAlinamaz = true;
      try{ localStorage.removeItem(UNDO_KEY); }catch(e2){}
    }

    /* YAZMA SONUCU DEGERLENDIRILIR. Once localWrite()'in donusu
       yutuluyordu: kota dolu bir tarayicida hicbir sey yazilmadigi halde
       cagri normal bitiyor, ekran «Yedek yuklendi» diyordu. Basarisiz bir
       kaydi basari gibi gostermek, bu depodaki en pahali hata tipidir. */
    const mevcut = localAll();
    const veri = cihazsiz(parsed.data);
    CIHAZA_AIT.forEach(k => { if(mevcut[k] !== undefined) veri[k] = mevcut[k]; });
    const onceki = Object.keys(mevcut);
    const yerel = localWrite(veri);
    if(!yerel){
      const e = new Error('Yedek bu cihaza yazılamadı; mevcut kayıt '
        + 'korundu. Depolama alanı dolu olabilir: Ayarlar → Veri '
        + 'bölümünden yer aç, sonra tekrar dene.');
      e.code = 'local-write';
      throw e;
    }
    degisti(Array.from(new Set(onceki.concat(Object.keys(veri)))));

    /* Buluta KISMI yazma ayrica raporlanir: «tamamlandi» izlenimi
       verilmez. */
    let bulutYazilan = 0, bulutHata = 0;
    if(db){
      for(const k of Object.keys(veri)){
        try{ await db.doc(k).set(veri[k]); bulutYazilan++; }
        catch(e){ bulutHata++; health.cloud = 'error'; }
      }
    }
    return Object.assign({}, parsed.meta, {
      local:true, cloudWritten:bulutYazilan, cloudFailed:bulutHata, geriAlinamaz,
      partialCloud:bulutHata > 0,
    });
  }

  /* En son ice aktarmadan ONCEKI duruma dair bilgi — «geri al» dugmesinin
     gorunup gorunmeyecegine bu karar verir. Icerigin kendisini degil,
     yalniz ne zaman alindigini dondurur. */
  function importUndoInfo(){
    try{
      const raw = localStorage.getItem(UNDO_KEY);
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      return { at:parsed.at };
    }catch(e){ return null; }
  }

  /* Son ice aktarmayi geri alir. TEK YUVALIDIR: bir kez kullanilinca
     yuva bosalir — ikinci bir «geri al» ilk ice aktarmadan ONCEKI
     duruma degil, geri alinmis duruma doner, bu da kafa karistirir. */
  async function undoImport(){
    let raw;
    try{ raw = localStorage.getItem(UNDO_KEY); }
    catch(e){ throw new Error('Geri alma kaydı okunamadı.'); }
    if(!raw) throw new Error('Geri alınacak bir içe aktarma yok.');
    let parsed;
    try{ parsed = JSON.parse(raw); }
    catch(e){ throw new Error('Geri alma kaydı bozuk.'); }

    const onceki = Object.keys(localAll());
    const yerel = localWrite(parsed.data);
    if(!yerel){
      const e = new Error('Geri alma bu cihaza yazılamadı. Depolama alanı dolu olabilir.');
      e.code = 'local-write';
      throw e;
    }
    degisti(Array.from(new Set(onceki.concat(Object.keys(parsed.data || {})))));
    try{ localStorage.removeItem(UNDO_KEY); }catch(e){}

    let bulutYazilan = 0, bulutHata = 0;
    if(db){
      for(const k of Object.keys(parsed.data)){
        try{ await db.doc(k).set(parsed.data[k]); bulutYazilan++; }
        catch(e){ bulutHata++; health.cloud = 'error'; }
      }
    }
    return { local:true, cloudWritten:bulutYazilan, cloudFailed:bulutHata, partialCloud:bulutHata > 0 };
  }

  async function clear(){
    const all = localAll();
    kopya = {};
    try{ localStorage.removeItem(LOCAL_KEY); }catch(e){}
    /* Hesaba bağlıysa silme sunucuya ve öteki cihazlara da gider (kapı bunu söyler). */
    degisti(Object.keys(all));
    if(db){
      for(const k of Object.keys(all)){
        try{ await db.doc(k).delete(); }catch(e){}
      }
    }
  }

  /* Kabaca kullanilan yerel alan (byte) */

  /* Koleksiyon basina boyut — "depo dolmus" uyarisi tek basina ise
     yaramaz; NEYIN buyudugunu bilmek gerekir. */
  function sizeByCollection(){
    const all = localAll();
    const out = {};
    Object.keys(all).forEach(function(k){
      const kok = k.indexOf('/') > 0 ? k.slice(0, k.indexOf('/')) : k;
      let n = 0;
      try{ n = JSON.stringify(all[k]).length; }catch(e){ n = 0; }
      if(!out[kok]) out[kok] = { collection:kok, bytes:0, count:0 };
      out[kok].bytes += n + k.length + 4;
      out[kok].count += 1;
    });
    return Object.keys(out).map(function(k){ return out[k]; })
      .sort(function(a, b){ return b.bytes - a.bytes; });
  }

  function localSize(){
    try{ return (localStorage.getItem(LOCAL_KEY) || '').length; }
    catch(e){ return 0; }
  }

  /* Tarayicilarin localStorage siniri genelde ~5 MB'tir (kaynak basina).
     Kesin deger okunamaz; bu yuzden 5 MB varsayilip doluluk yuzdesi tahmin edilir.
     %75 uzerinde kullaniciyi uyarmak icin `near` isaretlenir. */
  const LOCAL_QUOTA = 5 * 1024 * 1024;
  /* HATALAR D-17: sinir KAYNAK basinadir. Oteki profiller, «.oncesi»
     kopyasi ve ayar anahtarlari da ayni kotadan yer; yalniz etkin profili
     olcmek dolulugu eksik gosteriyordu. `profile` bu profilin payidir. */
  function originSize(){
    try{
      let n = 0;
      for(let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        n += k.length + (localStorage.getItem(k) || '').length;
      }
      return n;
    }catch(e){ return localSize(); }
  }
  function localQuota(){
    const bytes = originSize();
    const pct = Math.min(100, Math.round(100*bytes/LOCAL_QUOTA));
    return { bytes, profile:localSize(), limit:LOCAL_QUOTA, pct, near:pct >= 75, full:pct >= 92 };
  }

  return {
    init, get, set, remove, list, hepsi, uzaktan,
    alan:o.alan + '/' + PROFILE,
    activeProfileId(){ return PROFILE; },
    set onDegisim(fn){ onDegisim = fn; },
    exportAll, importAll, readBackup, importUndoInfo, undoImport, clear, localSize, originSize, localQuota, sizeByCollection,
    health(){ return Object.assign({ mode }, health); },
    set onError(fn){ onError = fn; },
    set onExternalWrite(fn){ onExternalWrite = fn; },
    get mode(){ return mode; },
  };
} });
