/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/pwa.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* PWA — çevrimdışı kabuğun kaydı (service worker: `sw.js`).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/pwa.js`; `tools/ortak.py --yay` ile üç arayüzün
   `src/js/core/` klasörüne birebir kopyalanır.

   Sözler:
     1. YALNIZ SUNUCUYLA. `http(s)` ile açılınca kaydedilir; `file://`
        ile açılan tek dosyada hiçbir şey denenmez (tarayıcı izin vermez).
     2. SESSİZ. Kayıt olmazsa uygulama eskisi gibi çalışır; hata
        kullanıcıya taşınmaz, sonuç döner.
     3. İLK AÇILIŞ DA SAKLANIR. Kabuk devreye girmeden yüklenen dosyaların
        adresi (yalnız aynı kökenden) kabuğa gönderilir.

   Manifest ayrı dosya değildir: `app.js › installManifest` onu gömülü
   üretir (tek dosya sürümüyle aynı yol). */

(function(){
  const L = window.LIFEOS = window.LIFEOS || {};
  const EN_COK = 400;

  function uygun(loc, nav){
    return !!loc && /^https?:$/.test(loc.protocol || '') && !!nav && ('serviceWorker' in nav);
  }

  /* Sayfanın yüklediği aynı kökenli dosyalar; ilki sayfanın kendisi. */
  function adresler(loc, perf){
    const out = [String(loc.href).split('#')[0]];
    const kaynaklar = (perf && typeof perf.getEntriesByType === 'function')
      ? perf.getEntriesByType('resource') : [];
    kaynaklar.forEach(k => {
      try{
        const u = new URL(k.name, loc.href);
        if(u.origin !== loc.origin) return;
        const a = u.href.split('#')[0];
        if(out.indexOf(a) < 0) out.push(a);
      }catch(e){}
    });
    return out.slice(0, EN_COK);
  }

  async function kaydet(o){
    o = o || {};
    const loc = o.location || (typeof location !== 'undefined' ? location : null);
    const nav = o.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if(!uygun(loc, nav)){
      return { ok:false, neden:loc && loc.protocol === 'file:' ? 'dosya' : 'desteklenmiyor' };
    }
    try{
      const kayit = await nav.serviceWorker.register(o.yol || 'sw.js', { scope:'./' });
      const hazir = await nav.serviceWorker.ready;
      const isci = (hazir && hazir.active) || kayit.active;
      const perf = o.performance || (typeof performance !== 'undefined' ? performance : null);
      if(isci) isci.postMessage({ tur:'onbellek', adresler:adresler(loc, perf) });
      return { ok:true };
    }catch(e){
      return { ok:false, neden:'kayit', hata:String((e && e.message) || e) };
    }
  }

  L.Pwa = { uygun, adresler, kaydet, EN_COK };
})();
