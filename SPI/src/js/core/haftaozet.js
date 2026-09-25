/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/haftaozet.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* HAFTALIK MERKEZ ÖZETİ — katalog 120, modül tarafı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/haftaozet.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Pazar 17:00'den sonra üç modülün Bugün'ünde haftanın tek kartı: her
   modülden bir satır, kesinlik çipiyle; bekleyen öneriler en altta. Veri
   HKM'nin `GET /api/merkez/hafta?date=` ucundan gelir (HKM core/merkez.py
   hafta_ozeti); satır biçimi Merkez yüzündeki `haftaHtml` ile aynıdır.

   Sözler:
   1. SAYI VE CÜMLE HKM'DEN. Bu dosya hiçbir şey hesaplamaz; gelen cümleyi
      ve kesinliği yazar. «veri yok» satırı sıfır diye çizilmez.
   2. HKM KAPALIYKEN KART YOK (AGENTS.md §1.4). Eşleşme yoksa istek bile
      yapılmaz; HKM yanıt vermezse 4 sn'de vazgeçilir, hata olursa kart
      çizilmez. Modül yavaşlamaz, beklemez.
   3. YALNIZ PAZAR AKŞAMI. Hafta içi HKM'ye sorulmaz. HKM de aynı saati
      `zamani` alanıyla söyler; ikisi ayrışırsa (HKM'nin saati başka)
      kart çizilmez.
   4. ÖNBELLEK. Aynı gün içinde 15 dakikada bir sorulur; arada son cevap
      yeniden kullanılır. Hata önbelleği düşürür: bilmediğimiz bir haftayı
      eski cevapla göstermeyiz. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.HaftaOzet = (function(){
  const ZAMAN_ASIMI = 4000;
  const TAZE_MS = 15 * 60 * 1000;
  const MODUL_ADI = { ays:'AYS', spi:'SPİ', esp:'ESP' };

  function pazarAksami(d){
    d = d || new Date();
    return d.getDay() === 0 && d.getHours() >= 17;
  }

  function gunISO(d){
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* Cevap bu biçimde değilse yok sayılır: yarım bir kart, yanlış bir
     karttan iyi değildir. */
  function gecerli(v){
    return !!(v && typeof v === 'object' && Array.isArray(v.satirlar) && v.satirlar.length
      && /^\d{4}-\d{2}-\d{2}$/.test(String(v.from || '')) && /^\d{4}-\d{2}-\d{2}$/.test(String(v.to || '')));
  }

  function kur(ortam){
    ortam = ortam || {};
    let onbellek = null;          // { gun, at, veri }

    function simdi(){ return ortam.simdi ? ortam.simdi() : new Date(); }

    function baglanti(){
      const b = ortam.hkm ? ortam.hkm() : null;
      if(!b || typeof b.settings !== 'function') return null;
      const a = b.settings() || {};
      if(!a.enabled || !a.token || (b.urlOk && !b.urlOk(a.url))) return null;
      const f = ortam.fetch || (typeof fetch === 'function' ? fetch : null);
      return f ? { url:String(a.url).replace(/\/$/, ''), token:a.token, f } : null;
    }

    /* Haftanın özeti ya da null. null = kart çizilmez. */
    async function cek(){
      const an = simdi();
      if(!pazarAksami(an)){ onbellek = null; return null; }
      const k = baglanti();
      if(!k){ onbellek = null; return null; }
      const gun = gunISO(an);
      if(onbellek && onbellek.gun === gun && an - onbellek.at < TAZE_MS) return onbellek.veri;

      const sure = ortam.zamanAsimi || ZAMAN_ASIMI;
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      let t = null;
      /* Sinyali dinlemeyen bir fetch de 4 sn'yi aşamaz: yarış. */
      const zaman = new Promise(ok => { t = setTimeout(() => { if(ctrl) ctrl.abort(); ok(null); }, sure); });
      const istek = (async () => {
        const f = k.f;
        const res = await f(k.url + '/api/merkez/hafta?date=' + gun, {
          headers:{ 'Authorization':'Bearer ' + k.token },
          signal:ctrl ? ctrl.signal : undefined,
        });
        if(!res || res.status !== 200) return null;
        try{ return await res.json(); }catch(e){ return null; }
      })().catch(() => null);
      let v = null;
      try{ v = await Promise.race([istek, zaman]); }
      finally{ if(t) clearTimeout(t); }

      if(!gecerli(v) || v.zamani === false){ onbellek = null; return null; }
      onbellek = { gun, at:an, veri:v };
      return v;
    }

    return { cek, son:() => (onbellek ? onbellek.veri : null) };
  }

  function kisaTarih(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? m[3] + '.' + m[2] : '';
  }

  /* HKM kesinliği Türkçe adıyla yollar («hesaplandı»); çip kimlikle
     çizilir. Bilinmeyen ad olduğu gibi yazılır (AGENTS.md §1.7). */
  function cip(ad){
    const L = window.LIFEOS || {};
    const e = (L.KESINLIK || []).filter(x => x.ad === ad)[0];
    if(L.KESINLIK_HTML) return L.KESINLIK_HTML(e ? e.id : ad);
    return '<span class="kesinlik"><span class="kesinlik__ad">' + kac(ad) + '</span></span>';
  }

  function bekleyenMetni(b){
    b = b || {};
    const m = b.moduller || {};
    const parca = ['ays', 'spi', 'esp'].filter(k => m[k]).map(k => MODUL_ADI[k] + ' ' + m[k]);
    if(!b.toplam) return 'Bekleyen öneri yok.';
    return '<b>' + kac(b.toplam) + ' öneri onayını bekliyor</b>'
      + (parca.length ? ' · modüllerde ' + kac(parca.join(' · ')) : '')
      + (b.king ? ' · King’de ' + kac(b.king) + ' iş' : '');
  }

  /* Kutu iskeleti (katalog 02) ile aynı işaretleme; düğme yok. */
  function kartHtml(v){
    if(!gecerli(v)) return '';
    const satir = s => '<li class="hozet__satir"><b class="hozet__modul">' + kac(s.modul_adi || MODUL_ADI[s.modul] || s.modul)
      + '</b><span class="hozet__cumle">' + kac(s.cumle) + '</span>' + cip(s.kesinlik) + '</li>';
    return '<section class="kutu hozet" data-oz="120">'
      + '<header class="kutu__bas"><h2 class="kutu__ad">Haftalık Merkez özeti</h2>'
      + '<span class="kutu__yuva">' + kac(kisaTarih(v.from)) + ' – ' + kac(kisaTarih(v.to)) + '</span></header>'
      + '<div class="kutu__govde">'
      + '<ul class="hozet__liste">' + v.satirlar.map(satir).join('') + '</ul>'
      + '<p class="hozet__alt">' + bekleyenMetni(v.bekleyen) + '</p>'
      + (v.not ? '<p class="hozet__not">' + kac(v.not) + '</p>' : '')
      + '</div></section>';
  }

  return { kur, kartHtml, pazarAksami, ZAMAN_ASIMI, TAZE_MS };
})();
