/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ice.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* İÇE AKTARMA — Google verisi hesap bağlamadan, üç arayüzde aynı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ice.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Sunucusu
   `sistem/ice.py`, testi `brand/ortak/ice.test.js`.
   ==================================================================

   Kullanıcı (2026-10-30): «Google bağlama çok çalışmıyor; neyi nasıl
   yapacağımız açık değil; birçok şeyimizi bağlayıp sistemin bunu çekmesini
   ve ESP, SPİ, AYS için yararlanmasını sağlayalım». Seçimi: hesap
   bağlanmaz; Takeout dosyası ve takvimin gizli iCal adresi.

   Ayarlar › Bağlantılar › Google'dan veri: adım adım rehber. Takeout
   dosyası TARAYICIDA okunur; sunucuya yalnız özeti gider (gün başına adım;
   gün başına izlenen video ve en çok izlenen kanallar). Modüller Analiz'de
   gösterir: takvim üçünde; adım SPİ'de, YouTube ESP'de. Hiçbir ölçüm
   kendiliğinden kayda yazılmaz (§1.4). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.ICE = (function(){
  'use strict';

  const L = window.LIFEOS;
  const VAR_ANAHTAR = 'lifeos.ice.var';
  const kac = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  const VARSAYILAN_ORTAM = { sunucu:() => typeof location !== 'undefined' && /^https?:$/.test(location.protocol) && /^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname), fetch:(u, o) => fetch(u, o) };
  let ortam = Object.assign({}, VARSAYILAN_ORTAM);
  let veri = null, mesaj = '', ayarOkundu = false;

  const varMi = () => { try{ return localStorage.getItem(VAR_ANAHTAR) === '1'; }catch(e){ return false; } };
  function isaretle(){
    const dolu = !!(veri && (veri.takvim.var || Object.keys(veri.veri || {}).length));
    try{ if(dolu) localStorage.setItem(VAR_ANAHTAR, '1'); else localStorage.removeItem(VAR_ANAHTAR); }catch(e){ /* depo yok */ }
  }
  function yukle(zorla){
    if(!ortam.sunucu() || (!zorla && !varMi())) return Promise.resolve(null);
    return ortam.fetch('/api/ice', { cache:'no-store' }).then(r => r.ok ? r.json() : null)
      .then(v => { veri = v; isaretle(); guncelle(); return v; }).catch(() => null);
  }
  function gonder(yol, govde){
    return ortam.fetch(yol, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-LifeOS':'ice' }, body:JSON.stringify(govde) })
      .then(r => r.json()).then(v => { if(v && v.takvim){ veri = v; mesaj = ''; isaretle(); } else mesaj = (v && v.hata) || 'Kaydedilemedi.'; guncelle(true); return v; })
      .catch(() => { mesaj = 'Kaydedilemedi: LifeOS sunucusu yanıt vermedi.'; guncelle(true); });
  }

  /* ---------------------------------------------------- Takeout çözücüleri */
  const gunOf = d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  /* Google Fit «Daily activity metrics.csv»: Date, …, Step count, … */
  function fitCoz(metin){
    const satir = String(metin || '').replace(/\r/g, '').split('\n').filter(Boolean);
    if(!satir.length) return null;
    const bas = satir[0].split(',').map(x => x.trim().toLowerCase());
    const t = bas.indexOf('date'), a = bas.findIndex(x => /step count/.test(x));
    if(t < 0 || a < 0) return null;
    const o = {};
    satir.slice(1).forEach(s => { const h = s.split(','); const g = (h[t] || '').trim(), x = (h[a] || '').trim(), n = Number(x); if(x && /^\d{4}-\d{2}-\d{2}$/.test(g) && isFinite(n) && n >= 0) o[g] = Math.round(n); });
    return Object.keys(o).length ? o : null;
  }
  /* YouTube «watch-history.json»: [{ title, subtitles:[{ name }], time }] */
  function youtubeCoz(metin){
    let l = null;
    try{ l = JSON.parse(metin); }catch(e){ return null; }
    if(!Array.isArray(l)) return null;
    const gunler = {}, kanal = {};
    l.forEach(x => {
      if(!x || !x.time) return;
      const d = new Date(x.time);
      if(isNaN(d)) return;
      const g = gunOf(d);
      gunler[g] = (gunler[g] || 0) + 1;
      const k = x.subtitles && x.subtitles[0] && x.subtitles[0].name;
      if(k) kanal[k] = (kanal[k] || 0) + 1;
    });
    if(!Object.keys(gunler).length) return null;
    const son = Object.keys(gunler).sort().slice(-400), g2 = {};
    son.forEach(k => { g2[k] = gunler[k]; });
    return { gunler:g2, kanallar:Object.keys(kanal).map(k => [k, kanal[k]]).sort((a, b) => b[1] - a[1]).slice(0, 15) };
  }
  function dosyaOku(dosya){
    return (dosya && dosya.text ? dosya.text() : Promise.reject()).then(m => {
      const fit = fitCoz(m);
      if(fit) return gonder('/api/ice/veri', { tur:'adim', ozet:fit }).then(() => 'adim');
      const yt = youtubeCoz(m);
      if(yt) return gonder('/api/ice/veri', { tur:'youtube', ozet:yt }).then(() => 'youtube');
      mesaj = 'Bu dosya tanınmadı. «Daily activity metrics.csv» (Fit) ya da «watch-history.json» (YouTube) seç.';
      guncelle(true);
      return null;
    }).catch(() => { mesaj = 'Dosya okunamadı.'; guncelle(true); return null; });
  }

  /* ------------------------------------------------------------ görünüm */
  const saatYaz = o => o.tum_gun ? 'tüm gün' : o.bas.slice(11, 16);
  const gunYaz = s => { try{ return new Date(s.slice(0, 10) + 'T12:00').toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' }); }catch(e){ return s.slice(0, 10); } };
  function ayarHtml(){
    if(!ortam.sunucu()) return '<div data-ice-ayar><p class="ayarlar__bos">Google verisi bu bilgisayardaki LifeOS sunucusunda durur; telefonda ve tek dosya sürümünde yoktur.</p></div>';
    if(!veri && !ayarOkundu){ ayarOkundu = true; setTimeout(() => yukle(true).then(() => guncelle(true)), 0); }   // Bağlantılar açılınca bir kez
    const t = veri ? veri.takvim : { var:false, olaylar:[] }, v = (veri && veri.veri) || {};
    return '<div class="ice" data-ice-ayar>'
      + '<h5 class="plan__alt">1 · Google Takvim</h5>'
      + '<p class="plan__not">Google Takvim › Ayarlar › takvimin adı › «Gizli adres, iCal biçiminde» bağlantısını kopyala, buraya yapıştır. Yarım saatte bir okunur.</p>'
      + '<div class="ice__satir"><input class="ayarlar__girdi" type="url" data-ice-adres placeholder="' + (t.var ? 'Kayıtlı · değiştirmek için yeni adres' : 'https://calendar.google.com/…/basic.ics') + '" aria-label="Takvimin gizli iCal adresi">'
      + '<button type="button" class="btn btn--sm" data-ice="takvim-kaydet">Kaydet</button>' + (t.var ? '<button type="button" class="btn btn--sm btn--ghost" data-ice="takvim-sil">Kaldır</button>' : '') + '</div>'
      + (t.var ? '<p class="plan__not">' + (t.olaylar.length ? 'Önümüzdeki 14 günde ' + t.olaylar.length + ' etkinlik.' : 'Önümüzdeki 14 günde etkinlik yok.') + (t.hata ? ' ' + kac(t.hata) : '') + '</p>' : '')
      + '<h5 class="plan__alt">2 · Google Takeout</h5>'
      + '<p class="plan__not"><a href="https://takeout.google.com" target="_blank" rel="noopener">takeout.google.com</a>’da yalnız «Fit» ve «YouTube ve YouTube Music › geçmiş»i seç, indir, zip’i aç; '
      + '«Daily activity metrics.csv» (adımlar, SPİ) ya da «watch-history.json» (izlediklerin, ESP) dosyasını seç. Dosya bu tarayıcıda okunur; yalnız günlük özet kaydedilir.</p>'
      + '<div class="ice__satir"><label class="btn btn--sm">Dosya seç<input type="file" accept=".csv,.json,text/csv,application/json" data-ice-dosya hidden></label>'
      + '<small class="muzik-ayar__durum" role="status">' + kac(mesaj) + '</small></div>'
      + (v.adim ? '<p class="plan__not">Adım: ' + Object.keys(v.adim.gunler || {}).length + ' gün aktarıldı.</p>' : '')
      + (v.youtube ? '<p class="plan__not">YouTube: ' + Object.keys(v.youtube.gunler || {}).length + ' günlük geçmiş aktarıldı.</p>' : '')
      + '</div>';
  }
  /* Analiz kartı: modül ne gösterecekse. Veri yoksa boş (kart çizilmez). */
  function kartHtml(modul){
    const ic = icerik(modul);
    return '<div data-ice-kart="' + kac(modul) + '">' + (ic ? '<section class="kutu ice-kart" aria-label="Google’dan gelen"><h2 class="kutu__ad">Google’dan gelen</h2>' + ic + '</section>' : '') + '</div>';
  }
  function icerik(modul){
    if(!veri) return '';
    let h = '';
    const ol = (veri.takvim && veri.takvim.olaylar) || [];
    if(ol.length) h += '<h3 class="ice-kart__alt">Takvimde</h3><ul class="ice-kart__liste">' + ol.slice(0, 5).map(o => '<li><span>' + kac(gunYaz(o.bas)) + ' · ' + kac(saatYaz(o)) + '</span><b>' + kac(o.ad) + '</b></li>').join('') + '</ul>';
    const v = veri.veri || {};
    if(modul === 'spi' && v.adim){
      const g = v.adim.gunler || {}, son = Object.keys(g).sort().slice(-7);
      if(son.length) h += '<h3 class="ice-kart__alt">Adım · Google Fit (ölçüldü, kayda yazılmadı)</h3><ul class="ice-kart__liste">' + son.reverse().map(k => '<li><span>' + kac(gunYaz(k)) + '</span><b>' + g[k].toLocaleString('tr-TR') + '</b></li>').join('') + '</ul>';
    }
    if(modul === 'esp' && v.youtube){
      const g = v.youtube.gunler || {}, son = Object.keys(g).sort().slice(-30), toplam = son.reduce((t, k) => t + g[k], 0);
      h += '<h3 class="ice-kart__alt">YouTube · son ' + son.length + ' gün, ' + toplam + ' video</h3><ul class="ice-kart__liste">'
        + (v.youtube.kanallar || []).slice(0, 5).map(x => '<li><span>' + kac(x[0]) + '</span><b>' + x[1] + '</b></li>').join('') + '</ul>';
    }
    return h;
  }
  function guncelle(ayarDa){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-ice-kart]').forEach(el => { el.outerHTML = kartHtml(el.getAttribute('data-ice-kart')); });
    if(ayarDa) document.querySelectorAll('[data-ice-ayar]').forEach(el => { el.outerHTML = ayarHtml(); });
  }

  let bagli = false;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('[data-ice]') : null;
      if(!b) return;
      e.preventDefault();
      if(b.getAttribute('data-ice') === 'takvim-kaydet'){ const i = document.querySelector('[data-ice-adres]'); if(i && i.value.trim()) gonder('/api/ice/takvim', { adres:i.value.trim() }); }
      else if(b.getAttribute('data-ice') === 'takvim-sil') gonder('/api/ice/takvim', { adres:'' });
    });
    document.addEventListener('change', e => {
      const t = e.target;
      if(t && t.matches && t.matches('[data-ice-dosya]') && t.files && t.files[0]){ dosyaOku(t.files[0]); t.value = ''; }
    });
  }
  if(typeof document !== 'undefined'){ bagla(); if(typeof window === 'undefined' || !window.__LIFEOS_TEST__) setTimeout(() => yukle(), 0); }

  function _ortam(o){ ortam = Object.assign({}, VARSAYILAN_ORTAM, o || {}); }
  function _veri(v){ veri = v || null; mesaj = ''; ayarOkundu = true; }
  return Object.freeze({ VAR_ANAHTAR, yukle, fitCoz, youtubeCoz, dosyaOku, ayarHtml, kartHtml, _ortam, _veri });
})();
