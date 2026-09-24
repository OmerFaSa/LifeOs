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
     4. BİLDİRİM KARTI (katalog 164) — aşağıda: kodla kurulur, izin
        kendiliğinden istenmez, eylemi service worker uygulamaz.

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


  /* ------------------------------------------------ 164 bildirim kartı

     Telefon bildirimi: modül, tek cümle, en çok iki eylem. Bildirimi KOD
     kurar; eylemi service worker UYGULAMAZ, uygulamaya iletir (sw.js
     `notificationclick` → `lifeos:bildirim` olayı) ve kararı modülün kendi
     kodu verir (AGENTS.md §1.1, §1.4).

     Platform farkı DOĞRULANDI (EKIP-PLANI Ek A 164): Chrome/Android
     eylem düğmesi gösterir (`Notification.maxActions`); iOS Safari özel
     eylemleri göstermez ve dokunuşu yalnız uygulamayı açmaya çevirir. Bu
     yüzden eylem sayısı platformdan okunur; eylemsiz platformda kart yine
     aynı cümleyi söyler, karar uygulamada verilir.

     Sistem bildirimine renk verilemez: modül RENKLE değil ADIYLA söylenir
     (başlığın başı «AYS ·»), 165'teki «renksiz de ayırt edilir» kuralı.
     İzin hiçbir zaman kendiliğinden istenmez: `izinIste` yalnız kullanıcının
     bastığı bir düğmeden çağrılır. */
  const BILDIRIM_MODUL = { ays:'AYS', spi:'SPİ', esp:'ESP', mer:'Merkez' };
  const EN_COK_EYLEM = 2;
  const YASAK_EYLEM = /^\s*(evet|tamam|ok|okay)\b/i;

  function bildirimDestegi(o){
    o = o || {};
    const N = o.Notification !== undefined ? o.Notification : (typeof Notification !== 'undefined' ? Notification : null);
    if(!N) return { var:false, izin:null, eylem:0 };
    const eylem = typeof N.maxActions === 'number' ? Math.max(0, Math.min(EN_COK_EYLEM, N.maxActions)) : 0;
    return { var:true, izin:N.permission || 'default', eylem:eylem };
  }

  /* k = { modul, baslik, cumle, eylemler:[{ id, ad }], rota, etiket } */
  function bildirimKarti(k, destek){
    k = k || {};
    destek = destek || { eylem:EN_COK_EYLEM };
    const hata = [];
    if(!BILDIRIM_MODUL[k.modul]) hata.push('modül bilinmiyor');
    if(!k.baslik || !String(k.baslik).trim()) hata.push('başlık yok');
    const c = String(k.cumle || '').trim();
    if(!c) hata.push('cümle yok');
    else if(!/[.!?]$/.test(c) || /[.!?]\s+\S/.test(c)) hata.push('tek cümle değil');
    const eylemler = Array.isArray(k.eylemler) ? k.eylemler : [];
    if(eylemler.length > EN_COK_EYLEM) hata.push('en çok iki eylem');
    eylemler.forEach(e => {
      if(!e || !e.id || !e.ad) hata.push('eylemin kimliği ya da adı yok');
      else if(YASAK_EYLEM.test(e.ad)) hata.push('eylem sonucu söylemeli («' + e.ad + '» değil)');
    });
    if(hata.length) return { ok:false, hatalar:hata };
    const gosterilen = eylemler.slice(0, destek.eylem || 0);
    return {
      ok:true,
      baslik:BILDIRIM_MODUL[k.modul] + ' · ' + String(k.baslik).trim(),
      secenek:{
        body:c,
        tag:k.etiket || (k.modul + ':' + (k.rota || 'genel')),
        /* adlar: uygulama kapalıyken SW eylemin ADINI adrese yazar (T2-11). */
        data:{ modul:k.modul, rota:k.rota || '', eylemler:eylemler.map(e => e.id),
          adlar:eylemler.reduce((a, e) => { a[e.id] = e.ad; return a; }, {}) },
        actions:gosterilen.map(e => ({ action:e.id, title:e.ad })),
      },
      gizlenenEylem:eylemler.length - gosterilen.length,
    };
  }

  /* Bildirimi gösterir. İzin yoksa SORMAZ, nedeni döner. */
  async function bildir(k, o){
    o = o || {};
    const d = bildirimDestegi(o);
    if(!d.var) return { ok:false, neden:'desteklenmiyor' };
    if(d.izin !== 'granted') return { ok:false, neden:'izin', izin:d.izin };
    const kart = bildirimKarti(k, d);
    if(!kart.ok) return { ok:false, neden:'kart', hatalar:kart.hatalar };
    const nav = o.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    try{
      const kayit = nav && nav.serviceWorker ? await nav.serviceWorker.ready : null;
      if(!kayit || typeof kayit.showNotification !== 'function') return { ok:false, neden:'kabuk-yok' };
      await kayit.showNotification(kart.baslik, kart.secenek);
      return { ok:true, gizlenenEylem:kart.gizlenenEylem };
    }catch(e){
      return { ok:false, neden:'hata', hata:String((e && e.message) || e) };
    }
  }

  /* Yalnız kullanıcının bastığı düğmeden. */
  async function izinIste(o){
    o = o || {};
    const N = o.Notification !== undefined ? o.Notification : (typeof Notification !== 'undefined' ? Notification : null);
    if(!N || typeof N.requestPermission !== 'function') return 'desteklenmiyor';
    try{ return await N.requestPermission(); }catch(e){ return 'denied'; }
  }

  /* Service worker'ın ilettiği eylemi uygulamaya olay olarak verir:
     `window` üstünde `lifeos:bildirim` { eylem, ad?, rota, modul }. Dinleyen
     modül kendi koduyla karar verir; kimse dinlemiyorsa hiçbir şey olmaz.

     Uygulama KAPALIYKEN basılan eylem (T2-11) adreste gelir
     (`?bildirim=…&ad=…&modul=…`): olay `kapaliyken:true` ile HEMEN verilir
     ve adres temizlenir (yenileyince ikinci kez sorulmaz). Bu yüzden
     `lifeos:bildirim` dinleyicisi bu çağrıdan ÖNCE kurulur. Kapalıyken
     basılan eylem sessizce uygulanmaz: modül `bildirimSorusu` ile sorar. */
  function bildirimDinle(o){
    o = o || {};
    const nav = o.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    const hedef = o.hedef || (typeof window !== 'undefined' ? window : null);
    if(!nav || !nav.serviceWorker || typeof nav.serviceWorker.addEventListener !== 'function' || !hedef) return false;
    nav.serviceWorker.addEventListener('message', ev => {
      const m = ev && ev.data;
      if(!m || m.tur !== 'bildirim') return;
      const detay = { eylem:m.eylem, rota:m.rota, modul:m.modul };
      if(m.ad) detay.ad = m.ad;
      hedef.dispatchEvent(new CustomEvent('lifeos:bildirim', { detail:detay }));
    });
    bekleyenBildirim(o, hedef);
    return true;
  }

  function bekleyenBildirim(o, hedef){
    const konum = o.konum || (typeof location !== 'undefined' ? location : null);
    if(!konum || !konum.search || typeof URLSearchParams === 'undefined') return;
    const q = new URLSearchParams(konum.search);
    const eylem = q.get('bildirim');
    if(!eylem) return;
    const detay = { eylem:eylem, rota:String(konum.hash || '').replace(/^#/, ''), modul:q.get('modul') || '',
      kapaliyken:true };
    if(q.get('ad')) detay.ad = q.get('ad');
    ['bildirim', 'ad', 'modul'].forEach(k => q.delete(k));
    const gecmis = o.gecmis || (typeof history !== 'undefined' ? history : null);
    const kalan = q.toString();
    try{
      if(gecmis && typeof gecmis.replaceState === 'function'){
        gecmis.replaceState(null, '', konum.pathname + (kalan ? '?' + kalan : '') + (konum.hash || ''));
      }
    }catch(e){ /* adres temizlenemedi: olay yine verilir */ }
    hedef.dispatchEvent(new CustomEvent('lifeos:bildirim', { detail:detay }));
  }

  /* Kapalıyken basılan eylem için modülün soracağı tek cümle. */
  function bildirimSorusu(d){
    d = d || {};
    const ad = String(d.ad || d.eylem || '').trim();
    return ad ? 'Bildirimde «' + ad + '» dedin; şimdi uygulansın mı?' : '';
  }

  L.Pwa = { uygun, adresler, kaydet, EN_COK,
    EN_COK_EYLEM, bildirimDestegi, bildirimKarti, bildir, izinIste, bildirimDinle, bildirimSorusu };
})();
