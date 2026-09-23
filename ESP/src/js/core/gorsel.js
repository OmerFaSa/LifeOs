/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gorsel.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* GÖRSEL DENETİMİ — tek dosya görselsiz açıldığında bunu SÖYLEMEK.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/gorsel.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Rütbe kartları, ajan portreleri ve kimlik logoları tek dosyaya
   GÖMÜLMEZ (81 MB'lık rütbe medyası bir HTML'e sığmaz); `build.py`
   onları dosyanın yanındaki `img/` klasörüne kopyalar. O klasör depoda
   durmaz (.gitignore): GitHub'dan ZIP olarak indirilen `dist/…html`
   çift tıklanınca görseller boş kalır ve kullanıcı bunun nedenini
   bilemez. İlk görülen şikâyet tam buydu: «ajan fotoğrafları, rütbeler,
   logolar yok».

   Kural: yalnız `file://` ile açılışta ve yalnız bir KİMLİK görseli
   gerçekten yüklenemediğinde, oturum başına BİR KEZ söylenir. Sunucuyla
   (BASLAT.bat) açılışta hiçbir şey yapılmaz. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.Gorsel = (function(){
  const METIN = 'Görseller bu dosyanın yanında değil: rütbe resimleri, ajan portreleri ve '
    + 'logolar img klasöründe durur. Hepsini görmek için sistemi BASLAT.bat ile aç ya da '
    + 'bu klasörde «python3 build.py» çalıştır.';
  const ANAHTAR = 'lifeos.gorselUyarisi';

  /* Karar saf bir işlevdir: protokol ve yükleme sonucu → metin | null. */
  function karar(protokol, yuklendi){
    if(protokol !== 'file:') return null;
    return yuklendi ? null : METIN;
  }

  function soylendiMi(){
    try{ return sessionStorage.getItem(ANAHTAR) === '1'; }catch(e){ return false; }
  }
  function isaretle(){
    try{ sessionStorage.setItem(ANAHTAR, '1'); }catch(e){}
  }

  /* `denetle('ays', metin => toast(metin))`. Yükleme sonucu beklenir;
     açılışı hiç yavaşlatmaz. */
  function denetle(mod, bildir){
    if(typeof location === 'undefined' || location.protocol !== 'file:' || soylendiMi()) return;
    const img = new Image();
    img.onload = () => {};
    img.onerror = () => {
      const m = karar(location.protocol, false);
      if(m && typeof bildir === 'function'){ isaretle(); bildir(m); }
    };
    img.src = 'img/marka/kimlik-' + String(mod || '').replace(/[^a-z]/g, '') + '.webp';
  }

  return { METIN, karar, denetle };
})();
