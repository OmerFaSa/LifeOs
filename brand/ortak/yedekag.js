/* OTOMATİK YEDEK — HKM açıkken modülün verisi günde bir kez HKM'ye.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/yedekag.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Tarayıcının deposu silinirse veri geri gelmez; bugüne kadar tek
   koruma kullanıcının elle indirdiği dosyaydı ve onu da haftada bir
   hatırlatıyorduk (`yedek.js`). HKM açıksa bu iş kendiliğinden olur.

   Sözler:
   1. HKM KAPALIYKEN HİÇBİR ŞEY OLMAZ. Bağlantı yoksa, yavaşsa ya da hata
      verirse deneme sessizce düşer; modül yavaşlamaz, hatırlatma olduğu
      gibi kalır.
   2. «ALINDI» DEMEK, HKM'NİN GERİ OKUYUP DOĞRULADIĞI DEMEKTİR. Modül
      hatırlatmayı ancak HKM aynı bayt sayısını (ve tarayıcı
      hesaplayabiliyorsa aynı SHA-256'yı) geri söylerse kapatır. Gönderdim
      demek, alındı demek değildir.
   3. GÜNDE BİR. Bugün bir yedek (elle ya da otomatik) alındıysa denenmez.
   4. BOŞ BİR MODÜL YEDEK YOLLAMAZ. Deposu silinmiş bir tarayıcı, iyi
      yedeklerin üstüne boş bir yedek yazdırmamalı: hatırlatmanın
      eşiğinin (`YEDEK_ASGARI_KAYIT`) altında hiçbir şey gönderilmez.
   5. KÜÇÜLME SÖYLENİR. HKM yeni yedeğin bir öncekinin yarısından küçük
      olduğunu söylerse bu kullanıcıya gösterilir: veri silinmiş olabilir. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.YedekAg = (function(){
  const ILK = 8000;              // açılıştan sonra: ilk çizim beklemesin
  const ARALIK = 60 * 60 * 1000; // uygulama gece açık kalırsa ertesi gün
  const SURE = 30000;            // dokuz aylık yedek yerel ağda da birkaç MB

  async function ozet(metin){
    const bayt = new TextEncoder().encode(metin);
    let sha = null;
    try{
      if(window.crypto && crypto.subtle && typeof crypto.subtle.digest === 'function'){
        const d = await crypto.subtle.digest('SHA-256', bayt);
        sha = Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    }catch(e){ sha = null; }
    return { bayt:bayt.length, sha };
  }

  /* `kur({ hkm:() => Beacon, modul:'ays', disaAktar:() => Store.exportAll(),
            kayit:() => sayı, yas:() => gün|null, isaretle:async () => {},
            bildir:metin => {} })` → { dene(), baslat(), son() } */
  function kur(ortam){
    let calisiyor = false;
    let son = null;

    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      if(!b || typeof b.settings !== 'function') return null;
      const a = b.settings() || {};
      if(!a.enabled || !a.token || !b.urlOk(a.url)) return null;
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      return f ? { url:String(a.url).replace(/\/$/, ''), token:a.token, f } : null;
    }

    async function gonder(k, metin){
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), SURE) : null;
      try{
        /* fetch bir nesnenin yöntemi olarak çağrılamaz («Illegal invocation»). */
        const f = k.f;
        const res = await f(k.url + '/api/yedek/' + ortam.modul, {
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
          body:metin, signal:ctrl ? ctrl.signal : undefined,
        });
        if(res.status !== 200) return null;
        return await res.json();
      }catch(e){
        return null;
      }finally{
        if(t) clearTimeout(t);
      }
    }

    async function dene(){
      if(calisiyor) return { ok:false, neden:'suruyor' };
      calisiyor = true;
      try{
        if(ortam.yas() === 0) return (son = { ok:false, neden:'bugun-alindi' });
        if((ortam.kayit() || 0) < LIFEOS.YEDEK_ASGARI_KAYIT) return (son = { ok:false, neden:'az-kayit' });
        const k = baglanti();
        if(!k) return (son = { ok:false, neden:'hkm-yok' });
        const metin = JSON.stringify(await ortam.disaAktar());
        const o = await ozet(metin);
        const g = await gonder(k, metin);
        if(!g || !g.ok) return (son = { ok:false, neden:'hkm-hata' });
        if(g.bayt !== o.bayt || (o.sha && g.sha256 !== o.sha)){
          return (son = { ok:false, neden:'dogrulanmadi' });
        }
        await ortam.isaretle();
        if(g.uyari && ortam.bildir) ortam.bildir(g.uyari);
        return (son = { ok:true, tarih:g.tarih, bayt:g.bayt, uyari:g.uyari || null });
      }catch(e){
        return (son = { ok:false, neden:'hata' });
      }finally{
        calisiyor = false;
      }
    }

    function baslat(){
      setTimeout(dene, ILK);
      setInterval(dene, ARALIK);
    }

    return { dene, baslat, son:() => son };
  }

  /* YENİ CİHAZA TAŞIMA (fikir 54): HKM'deki EN YENİ yedeği çeker ve
     döndürür; UYGULAMAZ. Uygulamak modülün kendi içe aktarma yoludur
     (okuma denetimi, onay, geri alma noktası). HKM modüle yazmaz.
     `hkmdenCek({ hkm:() => Beacon, modul:'ays', fetch? })`
       → { ok, tarih, tarihYazi, boyut, obj } | { ok:false, why } */
  async function hkmdenCek(ortam){
    const b = ortam.hkm ? ortam.hkm() : null;
    const a = b && typeof b.settings === 'function' ? (b.settings() || {}) : {};
    const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
    if(!b || !a.enabled || !a.token || !b.urlOk(a.url) || !f){
      return { ok:false, why:'HKM bağlı değil. Önce Ayarlar › HKM bağlantısından eşle.' };
    }
    const url = String(a.url).replace(/\/$/, '');
    const h = { 'Authorization':'Bearer ' + a.token };
    try{
      const l = await f(url + '/api/yedek', { headers:h });
      if(l.status !== 200) return { ok:false, why:'HKM yedek listesini vermedi (' + l.status + ').' };
      const son = (((await l.json()) || {}).moduller || {})[ortam.modul];
      if(!Array.isArray(son) || !son.length) return { ok:false, why:'HKM’de bu modülün yedeği yok.' };
      const y = son[0];
      const r = await f(url + '/api/yedek/' + encodeURIComponent(ortam.modul) + '/'
        + encodeURIComponent(y.tarih), { headers:h });
      if(r.status !== 200) return { ok:false, why:'Yedek indirilemedi (' + r.status + ').' };
      let obj;
      try{ obj = JSON.parse(await r.text()); }catch(e){ return { ok:false, why:'Yedek okunamadı; dosya bozuk.' }; }
      return { ok:true, tarih:y.tarih, tarihYazi:y.tarih_yazi || y.tarih, boyut:y.boyut || '', obj };
    }catch(e){
      return { ok:false, why:'HKM’ye ulaşılamadı.' };
    }
  }

  /* ONAY KARTININ SÖZÜ — üç arayüzün HKM kartı bu cümleyi gösterir.
     Kart «HKM'nin var olduğunu bilmez, işaret tek yönlüdür, tahlil GİTMEZ»
     diyordu; oysa aynı anahtar günde bir kez modülün BÜTÜN verisini
     yedek olarak HKM'ye yolluyor (ekip/HATALAR.md Y-8, B-2). Anahtarın
     neyi açtığı, açılmadan önce eksiksiz söylenir. */
  function kartNotu(ad){
    const a = String(ad || 'Bu modül');
    return a + ', HKM\'nin varlığını bilir ama ona bağımlı değildir: HKM kapalıyken, '
      + 'yavaşken ya da hata verirken ' + a + ' olduğu gibi çalışır. Bu anahtar iki şeyi '
      + 'birlikte açar: günün özeti (aşağıdaki tablo) ve günde bir kez ' + a + '\'nin '
      + 'BÜTÜN verisinin HKM\'ye yedeklenmesi; hafıza ve hedef özetleri ile HKM\'nin iş '
      + 'emirleri de aynı anahtarla gider. HKM başka bir makinedeyse bu veri cihazdan çıkar.';
  }

  return { kur, hkmdenCek, kartNotu };
})();
