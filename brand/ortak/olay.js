/* OLAY — modülün fark ettiğini HKM'ye taşır (KING-4 §C; biçim belgeler/ekip/KING-OLAY.md).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/olay.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Olayı modül üretir (`core/kingveri.js` → `olaylar(simdi)`): uyku düştü,
   sınava 30 gün kaldı, plan maddesi kaçtı, tekrar günü geldi. Bu dosya
   yalnız biçimi denetler ve `POST /api/olay` ile yollar; «King başlasın
   mı?» kararı HKM'nindir (core/kendiliginden.py).

   Sözler:
   1. SAYIYI MODÜL ÜRETİR, BURASI DEĞİŞTİRMEZ. Biçime uymayan olay (etiketsiz
      sayı, «veri yok» olup değeri olan, 8'den çok sayı, 80 harfi aşan kimlik)
      yola çıkmaz (AGENTS §1.2).
   2. HKM KAPALIYKEN SESSİZ (AGENTS §1.4). Eşleşme yoksa istek yok; istek
      4 sn'de vazgeçer, hata yutulur, modül beklemez.
   3. AYNI OLAY BİR KEZ. Kabul edilen kimlik cihazda iki gün tutulur ve bir
      daha yollanmaz; kabul edilmeyen (HKM kapalı, ağ) sonraki turda yeniden
      denenir. HKM de kimliği tekrar saymaz.
   4. AÇILIŞTA VE ON BEŞ DAKİKADA BİR. Tur boşta başlar (açılışı yavaşlatmaz);
      sekme gizliyken tur atılmaz. */
window.LIFEOS.PARCA.yazilar({
  'ortak.olay.bearer':'Bearer ',
});


window.LIFEOS = window.LIFEOS || {};

LIFEOS.OLAY = (function(){
  const ZAMAN_ASIMI = 4000;
  const ARALIK = 15 * 60 * 1000;
  const SAKLA_MS = 2 * 24 * 60 * 60 * 1000;
  const ETIKET = ['ölçüldü', 'hesaplandı', 'tahmin', 'veri yok'];
  const MODUL = ['ays', 'spi', 'esp'];

  /* Saf işlev: olay KING-OLAY.md biçiminde mi. */
  function gecerli(o, modul){
    if(!o || typeof o !== 'object' || o.modul !== modul || MODUL.indexOf(modul) < 0) return false;
    if(!/^[a-z_]{1,40}$/.test(String(o.tur || ''))) return false;
    if(typeof o.kimlik !== 'string' || !o.kimlik || o.kimlik.length > 80) return false;
    if(o.at != null && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(String(o.at))) return false;
    if(o.konu != null && (typeof o.konu !== 'string' || o.konu.length > 80)) return false;
    const s = o.sayilar;
    if(!s || typeof s !== 'object' || Array.isArray(s)) return false;
    const ad = Object.keys(s);
    if(!ad.length || ad.length > 8) return false;
    return ad.every(k => {
      const x = s[k];
      if(!x || ETIKET.indexOf(x.etiket) < 0) return false;
      if(x.etiket === 'veri yok') return x.deger === null;
      return typeof x.deger === 'number' && isFinite(x.deger);
    });
  }

  function kur(ortam){
    ortam = ortam || {};
    const modul = ortam.modul;
    const anahtar = 'lifeos.olay.giden.' + modul;
    let sayac = null;

    function simdi(){ return ortam.simdi ? ortam.simdi() : new Date(); }
    function depoOku(){
      try{ const v = JSON.parse(localStorage.getItem(anahtar) || '{}'); return v && typeof v === 'object' ? v : {}; }
      catch(e){ return {}; }
    }
    function depoYaz(v){ try{ localStorage.setItem(anahtar, JSON.stringify(v)); }catch(e){ /* kota: yeniden denenir */ } }

    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      if(!b || typeof b.settings !== 'function') return null;
      const a = b.settings() || {};
      if(!a.enabled || !a.token || a.baskaProfil || (b.urlOk && !b.urlOk(a.url))) return null;
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      return f ? { url:String(a.url).replace(/\/$/, ''), token:a.token, f } : null;
    }

    async function yolla(k, o){
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      let t = null;
      const zaman = new Promise(ok => { t = setTimeout(() => { if(ctrl) ctrl.abort(); ok(false); }, ortam.zamanAsimi || ZAMAN_ASIMI); });
      const istek = Promise.resolve(k.f(k.url + '/api/olay', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':yz('ortak.olay.bearer') + k.token },
        body:JSON.stringify(o), signal:ctrl ? ctrl.signal : undefined }))
        .then(r => !!(r && r.status >= 200 && r.status < 300), () => false);
      try{ return await Promise.race([istek, zaman]); }
      finally{ if(t) clearTimeout(t); }
    }

    /* Bir tur: üret, süz, yolla. Dönen: yollanıp kabul edilen kimlikler. */
    async function tur(){
      const k = baglanti();
      if(!k || typeof ortam.uret !== 'function') return [];
      const an = simdi();
      let l = [];
      try{ l = ortam.uret(an) || []; }catch(e){ return []; }
      const giden = depoOku(), sinir = an.getTime() - SAKLA_MS;
      Object.keys(giden).forEach(x => { if(!(giden[x] > sinir)) delete giden[x]; });
      const kabul = [];
      for(const o of l){
        if(!gecerli(o, modul) || giden[o.kimlik]) continue;
        if(await yolla(k, o)){ giden[o.kimlik] = an.getTime(); kabul.push(o.kimlik); }
      }
      depoYaz(giden);
      return kabul;
    }

    /* Modülün açılışı: ilk tur boşta, sonra on beş dakikada bir (gizliyken değil). */
    function baslat(){
      if(sayac != null) return;
      const gorunur = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';
      const at = () => { if(gorunur()) tur().catch(() => {}); };
      if(typeof requestIdleCallback === 'function') requestIdleCallback(at, { timeout:5000 });
      else setTimeout(at, 3000);
      sayac = setInterval(at, ARALIK);
    }

    return { tur, baslat };
  }

  return { kur, gecerli };
})();
