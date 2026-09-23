/* KING TEKLİFİ — onay bekleyen işler modülün kendi ekranında.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kingteklif.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Modül King'den ücretli bir iş istediğinde (ürün, test kitabı, müfredat)
   King işi BAM'da AÇMAZ: sınıfını, tahmini maliyetini ve süresini söyleyen
   bir teklif hazırlar (HKM `core/teklif.py`, `core/king.py` onay kapısı).
   Bu dosya o teklifleri modülün Bugün ekranına getirir ve onayı ya da
   iptali HKM'ye iletir.

   Sözler:
   1. SAYI VE CÜMLE HKM'DEN. Modül maliyet ya da sınıf hesaplamaz; gelen
      seçenek metnini gösterir (yüz kendi sayısını üretmez).
   2. ONAY AYNI KAPIDAN. Onay `POST /api/king/emir/<id>/onayla` ile gider;
      HKM ekranı ve sohbet kanalı da o işleve gelir. İkinci bir yol yok.
   3. HKM KAPALIYKEN HİÇBİR ŞEY OLMAZ. Bağlantı yoksa liste boş gelir; kart
      çizilmez, modül yavaşlamaz.
   4. İSTEK SONRASI TAZELENİR. Modül King'e iş verdiğinde `lifeos:king`
      olayını yayar; kart hemen tazelenir. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.KingTeklif = (function(){
  const OLAY = 'lifeos:king';

  function kur(ortam){
    let son = [];

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
      if(!k) return { baglanti:false };
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), 6000) : null;
      try{
        /* fetch bir nesnenin yöntemi olarak çağrılamaz («Illegal invocation»). */
        const f = k.f;
        const res = await f(k.url + yol, {
          method:govde === undefined ? 'GET' : 'POST',
          headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
          body:govde === undefined ? undefined : JSON.stringify(govde),
          signal:ctrl ? ctrl.signal : undefined,
        });
        let g = null;
        try{ g = await res.json(); }catch(e){ g = null; }
        return { baglanti:true, status:res.status, govde:g };
      }catch(e){
        return { baglanti:true, status:0, govde:null };
      }finally{
        if(t) clearTimeout(t);
      }
    }

    /* Onay bekleyen teklifler. Bağlantı ya da cevap yoksa BOŞ liste: kart
       çizilmez. Önceki liste de düşer — bilmediğimiz bir teklifi bekliyor
       göstermek, olmayan bir işi var göstermek olurdu. */
    async function cek(){
      const r = await istek('/api/king/teklifler/' + ortam.modul);
      son = (r.status === 200 && r.govde && Array.isArray(r.govde.teklifler))
        ? r.govde.teklifler.slice(0, 10) : [];
      return son;
    }

    async function onayla(id, secenek){
      const r = await istek('/api/king/emir/' + encodeURIComponent(id) + '/onayla',
        { secenek:secenek || null });
      if(!r.baglanti) return { ok:false, metin:'HKM bağlı değil; teklif onaylanamadı.' };
      const g = r.govde || {};
      if(r.status !== 200 || !g.ok){
        return { ok:false, metin:g.note || 'Teklif onaylanamadı (' + (r.status || 'bağlantı') + ').' };
      }
      son = son.filter(x => String(x.id) !== String(id));
      const e = g.emir || {};
      if(e.durum === 'reddedildi'){
        return { ok:false, metin:'Onayladın ama iş açılamadı: ' + (g.note || 'imkân kontrolü geçmedi.') };
      }
      return { ok:true, metin:'Onaylandı: iş emri #' + e.id + ' BAM’da açıldı'
        + (e.tahmin && e.tahmin.metin ? '; tahmini süre ' + e.tahmin.metin + ' (tahmin)' : '')
        + '. Bitince sonuç teklif olarak gelir.' };
    }

    /* Ara onay (Part 8b): parça parça üretimde bölüm bitti; «devam» ya da
       «dur». Dur, üretilenle bitirir; hiçbir bölüm kaybolmaz. */
    async function parca(id, karar){
      if(karar !== 'devam' && karar !== 'dur') return { ok:false, metin:'Geçersiz cevap.' };
      const r = await istek('/api/king/emir/' + encodeURIComponent(id) + '/' + karar, {});
      if(!r.baglanti) return { ok:false, metin:'HKM bağlı değil; cevap iletilemedi.' };
      const g = r.govde || {};
      if(r.status !== 200 || !g.ok) return { ok:false, metin:g.note || 'İletilemedi.' };
      son = son.filter(x => String(x.id) !== String(id));
      return { ok:true, metin:g.note };
    }

    async function iptal(id){
      const r = await istek('/api/king/emir/' + encodeURIComponent(id) + '/iptal', {});
      if(!r.baglanti) return { ok:false, metin:'HKM bağlı değil; teklif iptal edilemedi.' };
      if(r.status !== 200) return { ok:false, metin:'İptal edilemedi (' + (r.status || 'bağlantı') + ').' };
      son = son.filter(x => String(x.id) !== String(id));
      return { ok:true, metin:'Teklif iptal edildi; iş açılmadı.' };
    }

    return { cek, onayla, parca, iptal, liste:() => son.slice() };
  }

  /* Modül King'e iş verdiğinde çağırır: kart hemen tazelenir. */
  function haberVer(){
    try{ window.dispatchEvent(new CustomEvent(OLAY)); }catch(e){ /* eski tarayıcı */ }
  }

  return { kur, haberVer, OLAY };
})();
