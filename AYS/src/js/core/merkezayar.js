/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/merkezayar.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* MERKEZ AYARI — Ayarlar › King ve bağlantılar'ın veri katmanı (Gün planı F1).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/merkezayar.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   HKM'nin /api/config ayarlarından yalnız GÖRÜNEN kısım: model paketi, aylık
   tavan, kanal aç-kapa ve modül başına bir eşik. Sözler:
   1. SIR YOK. Anahtar, jeton, sunucu burada okunmaz ve yazılmaz (Atölye'de).
   2. Yama yalnız izinli alanı taşır; aralık dışı değer HKM'ye hiç gitmez.
   3. Ölçülmemiş aylık tutar «veri yok»tur, sıfır değil.
   Kabul testi: tools/merkezayar_kabul_test.py */
window.LIFEOS = window.LIFEOS || {};

LIFEOS.MerkezAyar = (function(){
  'use strict';

  const PAKETLER = ['A', 'A+', 'S', 'S+'];
  const KANALLAR = [['whatsapp', 'WhatsApp'], ['telegram', 'Telegram']];
  const ESIKLER = [['bio', 'sleep_hours_min'], ['academic', 'study_minutes_min'], ['intellect', 'practice_minutes_min']];
  const TAVAN = { usd:[0, 5000], try:[0, 100000] };
  const sayi = v => typeof v === 'number' && isFinite(v);
  const nesne = v => v && typeof v === 'object' ? v : {};

  function gorunum(cfg, paketler){
    cfg = nesne(cfg);
    const p = nesne(paketler), b = nesne(cfg.budget), birim = b.ceiling_currency === 'try' ? 'try' : 'usd';
    const deger = birim === 'try' ? b.monthly_try : b.monthly_usd;
    const th = nesne(cfg.thresholds), ar = nesne(cfg.ranges), ad = nesne(cfg.threshold_names);
    return {
      paket:{ secili:p.aktif || null, liste:(Array.isArray(p.paketler) ? p.paketler : []).map(x => ({
        id:x.id, ad:x.ad, aylik:sayi(x.aylik) ? x.aylik : null, etiket:sayi(x.aylik) ? 'tahmin' : 'veri yok' })) },
      tavan:{ birim, deger:sayi(deger) ? deger : null },
      kanallar:KANALLAR.map(([k, baslik]) => { const c = nesne(nesne(cfg.channels)[k]);
        return { ad:k, baslik, acik:c.enabled === true, hazir:c.ready === true }; }),
      esikler:ESIKLER.filter(([g, a]) => sayi(nesne(th[g])[a]) && Array.isArray(nesne(ar[g])[a])).map(([g, a]) => ({
        grup:g, ad:a, etiket:nesne(ad[g])[a] || a, deger:th[g][a], min:ar[g][a][0], max:ar[g][a][1] })),
    };
  }

  function yama(d, cfg){
    d = nesne(d);
    const red = hata => ({ ok:false, hata });
    if(d.tur === 'paket') return PAKETLER.indexOf(d.deger) >= 0 ? { ok:true, yama:{ models:{ paket:d.deger } } } : red('Bilinmeyen model paketi.');
    if(d.tur === 'tavan'){
      const s = TAVAN[d.birim];
      if(!s) return red('Para birimi USD ya da TL olmalı.');
      if(!sayi(d.deger) || d.deger < s[0] || d.deger > s[1]) return red('Aylık tavan ' + s[0] + '–' + s[1] + ' arasında bir sayı olmalı.');
      return { ok:true, yama:{ budget:{ ceiling_currency:d.birim, [d.birim === 'try' ? 'monthly_try' : 'monthly_usd']:d.deger } } };
    }
    if(d.tur === 'kanal'){
      if(!KANALLAR.some(([k]) => k === d.ad)) return red('Bilinmeyen kanal.');
      if(typeof d.acik !== 'boolean') return red('Kanal açık ya da kapalı olmalı.');
      return { ok:true, yama:{ channels:{ [d.ad]:{ enabled:d.acik } } } };
    }
    if(d.tur === 'esik'){
      const r = nesne(nesne(nesne(cfg).ranges)[d.grup])[d.ad];
      if(!Array.isArray(r)) return red('Bilinmeyen eşik.');
      if(!sayi(d.deger) || d.deger < r[0] || d.deger > r[1]) return red('Eşik ' + r[0] + '–' + r[1] + ' arasında olmalı.');
      return { ok:true, yama:{ thresholds:{ [d.grup]:{ [d.ad]:d.deger } } } };
    }
    return red('Bu ayar buradan değiştirilmez.');
  }

  function kur(ortam){
    ortam = ortam || {};
    let son = null;
    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      if(!b || typeof b.settings !== 'function') return null;
      const a = b.settings() || {};
      if(!a.enabled || !a.token || !(b.urlOk ? b.urlOk(a.url) : a.url)) return null;
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      return f ? { url:String(a.url).replace(/\/$/, ''), token:a.token, f } : null;
    }
    async function istek(k, yol, govde){
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
      try{
        const f = k.f;                       // yöntem olarak çağrılmaz («Illegal invocation»)
        const res = await f(k.url + yol, {
          method:govde === undefined ? 'GET' : 'POST',
          headers:Object.assign({ 'Authorization':'Bearer ' + k.token }, govde === undefined ? {} : { 'Content-Type':'application/json' }),
          body:govde === undefined ? undefined : JSON.stringify(govde),
          signal:ctrl ? ctrl.signal : undefined,
        });
        let veri = null;
        try{ veri = await res.json(); }catch(e){ /* gövdesiz */ }
        return { durum:res.status, veri };
      }finally{
        if(t) clearTimeout(t);
      }
    }
    async function oku(){
      const k = baglanti();
      if(!k) return { ok:false, neden:'baglanti' };
      try{
        const [c, p] = await Promise.all([istek(k, '/api/config'), istek(k, '/api/models/paketler')]);
        if(c.durum !== 200 || p.durum !== 200) return { ok:false, neden:'hata' };
        son = c.veri;
        return { ok:true, cfg:c.veri, paketler:p.veri, gorunum:gorunum(c.veri, p.veri) };
      }catch(e){
        return { ok:false, neden:'hata' };
      }
    }
    async function yaz(d){
      const y = yama(d, son || {});
      if(!y.ok) return y;
      const k = baglanti();
      if(!k) return { ok:false, neden:'baglanti' };
      try{
        const r = await istek(k, '/api/config', y.yama);
        if(r.durum === 200) return { ok:true };
        if(r.durum === 422) return { ok:false, hata:(nesne(r.veri).errors || []).join('; ') || 'Merkez değeri kabul etmedi.' };
        return { ok:false, neden:'hata' };
      }catch(e){
        return { ok:false, neden:'hata' };
      }
    }
    return { oku, yaz };
  }

  return { gorunum, yama, kur };
})();
