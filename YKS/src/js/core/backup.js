/* Otomatik yedek — veri kaybına karşı iki ayrı katman.

   Bütün veri tarayıcının localStorage'ında durur ve iki ayrı riske açıktır.
   Bunlar aynı şey değildir ve çözümleri de aynı değildir:

   1. KAZA — uygulama hatası, yanlış bir içe aktarma, yanlışlıkla "sıfırla".
      Veri hâlâ tarayıcıdadır ama bozulmuştur.
      Çözüm: aynı depoda AYRI bir anahtarda tutulan dönen anlık görüntü.
      Sessizce alınır, tek dokunuşla geri yüklenir.

   2. KAYIP — tarayıcı verisi temizlendi, cihaz değişti, disk gitti.
      Anlık görüntü de aynı depoda olduğu için bunu KURTARMAZ.
      Tek çare veriyi tarayıcının dışına çıkarmaktır: indirilen dosya.

   Bu modül birincisini otomatikleştirir. İkincisi otomatikleştirilemez —
   tarayıcılar kullanıcı hareketi olmadan dosya indirtmez — ama görünmez
   olmaktan çıkarılabilir; ekrandaki hatırlatma bu yüzden vardır.

   ALAN. Anlık görüntü ana verinin bir kopyasıdır, yani depoyu ikiye katlar.
   Kota zaten dar (~5 MB) olduğu için en fazla iki görüntü tutulur; yazma
   kotayı zorlarsa önce eskisi atılır, yine olmazsa görüntü hiç alınmaz.
   Asıl veriyi riske atmak, yedek almamaktan kötüdür. */

window.R = window.R || {};

R.Backup = (function(){
  const U = R.U;

  const MAX_SNAPSHOTS = 2;
  const INTERVAL_HOURS = 12;   // bu süre geçmeden yeni görüntü alınmaz
  const MIN_RECORDS = 5;       // korunacak veri yoksa görüntü alınmaz
  const QUOTA_CEILING = 60;    // yerel alan bu yüzdenin üstündeyse alınmaz

  /* Anlik goruntuler profil basina ayrilir. Sahte depoda profil alani
     bulunmayabilir; o durumda ana profil varsayilir. */
  function key(){ return 'rota84285.snap.' + (R.Store.profile || 'main'); }

  function read(){
    try{
      const raw = localStorage.getItem(key());
      const doc = raw ? JSON.parse(raw) : null;
      return (doc && Array.isArray(doc.items)) ? doc : { items:[] };
    }catch(e){ return { items:[] }; }
  }

  /* Yazma kotaya takilabilir; cagiran yakalar ve daraltip tekrar dener. */
  function write(doc){ localStorage.setItem(key(), JSON.stringify(doc)); }

  /* ---------- okuma ---------- */

  /* Govdesiz liste — ekranda gosterilir, payload tasinmaz. */
  function list(){
    return read().items.map(x => ({
      id:x.id, at:x.at, reason:x.reason, records:x.records,
    }));
  }

  function ageHours(iso){
    if(!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  }

  function status(){
    const items = read().items;
    const last = items[0] || null;
    return {
      count:items.length,
      lastAt:last ? last.at : null,
      lastAgeHours:last ? ageHours(last.at) : null,
      /* Disari alinan gercek yedek — asil koruma budur. */
      exportAgeDays:R.Model.backupAgeDays(),
      exportDue:R.Model.backupDue(),
      quota:R.Store.localQuota(),
    };
  }

  /* ---------- yazma ---------- */

  function take(reason){
    const foot = R.Model.dataFootprint();
    if(foot.total < MIN_RECORDS) return { ok:false, why:'Korunacak veri yok.' };

    /* Alan darsa once eski goruntuleri at; yine dar kaliyorsa vazgec. */
    if(R.Store.localQuota().pct >= QUOTA_CEILING){
      try{ write({ items:[] }); }catch(e){}
      const after = R.Store.localQuota();
      if(after.pct >= QUOTA_CEILING){
        return { ok:false, why:'Yerel alan %' + after.pct + ' dolu; anlık görüntü alınmadı.' };
      }
    }

    const payload = R.Store.exportAll();
    /* Depo kayitlari ya {__meta, data} sarmalinda ya da duz sozluk olarak
       verir; sayim ikisinde de dogru olsun. Govde ne gelirse geri yuklemeye
       de o gider, yani bicim burada yorumlanmaz. */
    const bag = (payload && payload.data) ? payload.data : payload;
    const item = {
      id:U.uid('s'),
      at:new Date().toISOString(),
      reason:String(reason || 'otomatik'),
      records:Object.keys(bag || {}).length,
      payload,
    };

    const doc = read();
    doc.items = [item].concat(doc.items).slice(0, MAX_SNAPSHOTS);
    try{
      write(doc);
    }catch(e){
      /* Kota taşti: yalnizca en yenisini tut ve bir kez daha dene. */
      try{ write({ items:[item] }); }
      catch(e2){ return { ok:false, why:'Yerel alan yetmedi; anlık görüntü alınamadı.' }; }
    }
    return { ok:true, id:item.id, at:item.at, records:item.records };
  }

  /* Uygulama acilisinda cagrilir. Sessizdir: bir sey sormaz, bir sey
     gostermez, hata verirse yutar — acilisi bir yedek yuzunden bozmak
     yedegin kendisinden kotudur. */
  function maybeTake(){
    try{
      const last = read().items[0];
      if(last && ageHours(last.at) < INTERVAL_HOURS){
        return { ok:false, why:'Görüntü zamanı değil.' };
      }
      return take('otomatik');
    }catch(e){
      return { ok:false, why:'Anlık görüntü alınamadı.' };
    }
  }

  async function restore(id){
    const item = read().items.find(x => x.id === id);
    if(!item || !item.payload) return { ok:false, why:'Anlık görüntü bulunamadı.' };
    /* Geri yuklemeden ONCE simdiki hâlin goruntusu alinir: yanlis goruntuyu
       geri yuklemek de bir kazadir ve ondan da donulebilmeli. */
    take('geri yükleme öncesi');
    await R.Store.importAll(item.payload);
    return { ok:true, records:item.records, at:item.at };
  }

  function remove(id){
    const doc = read();
    doc.items = doc.items.filter(x => x.id !== id);
    try{ write(doc); return true; }catch(e){ return false; }
  }

  function clear(){
    try{ localStorage.removeItem(key()); return true; }catch(e){ return false; }
  }

  return {
    list, status, take, maybeTake, restore, remove, clear,
    MAX_SNAPSHOTS, INTERVAL_HOURS,
  };
})();
