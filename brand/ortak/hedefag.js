/* HEDEF AĞI — modülün etkin hedeflerinin ÖZETİ HKM'ye; zaman bütçesi geri.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hedefag.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Üç modül birbirini görmez; ama üç hedef AYNI GÜNÜ paylaşır. Zaman
   bütçesini yalnız merkez hesaplayabilir (HKM `core/hedefag.py`).

   Sözler:
   1. HKM MODÜLE YAZMAZ. Modül yalnız ÖZET yollar: kimlik, kısa ad,
      durum, son tarih, vakit, kararın bandı, planın ilerlemesi. Hedefin
      kendisi (cümle, cevaplar, kişisel ölçümler) gitmez.
   2. ANLIK GÖRÜNTÜ. Her gönderim TAMAMINI yollar; aynı görüntü iki kez
      gelirse HKM'de hiçbir şey değişmez.
   3. HKM KAPALIYKEN HİÇBİR ŞEY OLMAZ. Bağlantı yoksa, yavaşsa ya da
      hata verirse gönderim sessizce düşer; modül yavaşlamaz.
   4. BÜTÇENİN CÜMLESİNİ HKM KURAR. Modül sayı hesaplamaz, gelen metni
      gösterir (yüz kendi sayısını üretmez). */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.HedefAg = (function(){
  const GECIKME = 600;

  /* Hedef + (varsa) plan → HKM'nin beklediği özet. */
  function ozet(h, o){
    const x = o || {};
    const k = h.kapasite && h.kapasite.gunluk_dk > 0
      ? { gunluk_dk:Math.round(h.kapasite.gunluk_dk), haftalik_gun:h.kapasite.haftalik_gun || 7 } : null;
    const g = h.gerceklik && h.gerceklik.bant
      ? { bant:h.gerceklik.bant, etiket:h.gerceklik.etiket || 'tahmin' } : null;
    const il = x.ilerleme || null;
    return {
      id:String(h.id), ozet:String(x.ozet || h.cumle || '').slice(0, 160), paket:h.paket || null,
      durum:h.durum, son_tarih:h.son_tarih || null, kapasite:k, gerceklik:g,
      plan:x.plan ? { bitis:x.plan.bitis || null,
        ilerleme:il ? { durum:il.durum, metin:typeof il.metin === 'string' ? il.metin.slice(0, 300) : null }
          : { durum:'veri_yok', metin:null } } : null,
    };
  }

  /* `kur({ hkm:() => Beacon, modul:'ays', ozetler:() => [ozet…], yarin?:async () => ({gun, isler}) })`
     → { gonder(), planla(), cek(), butce() } */
  function kur(ortam){
    let zaman = null;
    let son = null;

    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      if(!b || typeof b.settings !== 'function') return null;
      const a = b.settings() || {};
      if(!a.enabled || !a.token || !b.urlOk(a.url)) return null;
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      return f ? { url:String(a.url).replace(/\/$/, ''), token:a.token, f } : null;
    }

    async function istek(yol, govde){
      const k = baglanti();
      if(!k) return null;
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
      try{
        /* fetch bir nesnenin yöntemi olarak çağrılamaz («Illegal invocation»):
           yerel değişkenden çağrılır. */
        const f = k.f;
        const res = await f(k.url + yol, {
          method:govde === undefined ? 'GET' : 'POST',
          headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
          body:govde === undefined ? undefined : JSON.stringify(govde),
          signal:ctrl ? ctrl.signal : undefined,
        });
        if(res.status !== 200) return null;
        return await res.json();
      }catch(e){
        return null;
      }finally{
        if(t) clearTimeout(t);
      }
    }

    /* Yarının ilk işleri (akşam «yarın şunlar var», HKM schedule). İşleri
       modülün KENDİ kodu seçer; kanca yoksa ya da bozuksa gönderilmez. */
    async function yarin(){
      if(typeof ortam.yarin !== 'function') return undefined;
      try{
        const y = await ortam.yarin();
        if(!y || !/^\d{4}-\d{2}-\d{2}$/.test(String(y.gun || ''))) return undefined;
        const isler = (Array.isArray(y.isler) ? y.isler : []).map(x => ({
          metin:String((x && x.metin) || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          dk:x && typeof x.dk === 'number' && isFinite(x.dk) && x.dk > 0 ? Math.round(x.dk) : null,
        })).filter(x => x.metin).slice(0, 5);
        return { gun:y.gun, isler };
      }catch(e){
        return undefined;
      }
    }

    async function gonder(){
      let l = [];
      try{ l = (ortam.ozetler() || []).slice(0, 30); }catch(e){ return { ok:false }; }
      const govde = { hedefler:l };
      const y = await yarin();
      if(y) govde.yarin = y;
      const g = await istek('/api/hedef/sync/' + ortam.modul, govde);
      if(g && g.butce) son = g.butce;
      return { ok:!!(g && g.ok), butce:son };
    }

    /* Art arda gelen değişiklikler TEK gönderim olur. */
    function planla(){
      if(zaman) clearTimeout(zaman);
      zaman = setTimeout(() => { zaman = null; gonder(); }, GECIKME);
    }

    async function cek(){
      const g = await istek('/api/hedefler');
      if(g && g.butce) son = g.butce;
      return son;
    }

    return { gonder, planla, cek, butce:() => son };
  }

  return { ozet, kur };
})();
