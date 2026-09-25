/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/ornekkip.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* ÖRNEK VERİ KİPİ — katalog 172.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/ornekkip.js`; `python3 tools/ortak.py --yay` ile
   üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Sistemi örnek veriyle denemek (Ayarlar › Veri). Sözler:
   1. GERÇEK VERİYE HİÇBİR YOLLA KARIŞMAZ. Örnek veri ayrılmış bir profil
      anahtarında («ornek») durur; modülün çok profilli deposu onu ayrı
      bir anahtara yazar. Gerçek profilin anahtarına dokunulmaz.
   2. DIŞARI ÇIKMAZ. Örnek profilde HKM işareti her zaman kapalıdır
      (üç `beacon.js` `settings()`); özet, yedek, hafıza, hedef ve King
      kanalları oradan geçer.
   3. GÖRÜNÜR. Üstte şeritli uyarı, arkada «ÖRNEK» filigranı; şeritte TEK
      düğme: «Örnek veriden çık». Çıkış örnek profilin anahtarlarını siler
      ve önceki profile döner.
   Geçiş sayfa yenilenerek olur: depo profil anahtarını açılışta okur. */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.OrnekKip = (function(){
  const PROFIL = 'ornek';

  /* o = { anahtar:'rota.activeProfile', varsayilan:'main',
           silinecek:['rota84285.v2.ornek', ...], depo?:localStorage } */
  function kur(o){
    const d = o.depo || (typeof localStorage !== 'undefined' ? localStorage : null);
    const ONCE = o.anahtar + '.ornekOncesi';
    const oku = k => { try{ return d ? d.getItem(k) : null; }catch(e){ return null; } };
    function aktif(){ return oku(o.anahtar) || o.varsayilan; }
    function acik(){ return aktif() === PROFIL; }
    function gir(){
      if(!d || acik()) return false;
      try{ d.setItem(ONCE, aktif()); d.setItem(o.anahtar, PROFIL); return true; }
      catch(e){ return false; }
    }
    function cik(){
      if(!d || !acik()) return false;
      const once = oku(ONCE);
      try{
        (o.silinecek || []).forEach(k => d.removeItem(k));
        d.removeItem(ONCE);
        /* Önceki profil örnek olamaz; bilinmiyorsa varsayılana döner. */
        d.setItem(o.anahtar, once && once !== PROFIL ? once : o.varsayilan);
        return true;
      }catch(e){ return false; }
    }
    /* Çıkıştan sonra sayfa kapanırken bekleyen kayıt örnek anahtarı geri
       yazabilir; örnek kipte DEĞİLKEN açılışta kalıntı silinir. */
    if(d && !acik()){ try{ (o.silinecek || []).forEach(k => d.removeItem(k)); }catch(e){ /* depo kapalı */ } }
    return { acik, gir, cik, aktif };
  }

  function seritHtml(){
    return '<div class="ornek-serit" role="status" data-oz="172">'
      + '<p class="ornek-serit__metin"><b>Örnek veri.</b> Gördüğün kayıtlar gerçek değil; gerçek verin ayrı durur, '
      + 'değişmez ve Merkez’e gitmez.</p>'
      + '<button type="button" class="btn btn--sm" data-act="ornek-cik">Örnek veriden çık</button></div>';
  }

  function filigranHtml(){
    return '<div class="ornek-filigran" aria-hidden="true"></div>';
  }

  /* Ayarlar › Veri satırının gövdesi; modül kendi kartına sarar. Tek
     düğme; etiketi sonucu söyler (022). */
  function ayarHtml(acik){
    return '<div class="ornek-ayar" data-oz="172"><p class="small muted">' + (acik
        ? 'Şu an örnek verideysin. Çıkınca örnek kayıtlar silinir, gerçek profiline dönersin.'
        : 'Sistemi dolu hâliyle görmek için örnek bir profil açılır. Gerçek verin ayrı anahtarda durur; '
          + 'örnek veri ona hiçbir yolla karışmaz ve Merkez’e gitmez.') + '</p>'
      + '<div class="mt-10"><button type="button" class="btn btn--sm" data-act="' + (acik ? 'ornek-cik' : 'ornek-gir') + '">'
      + (acik ? 'Örnek veriden çık' : 'Örnek veriye geç') + '</button></div></div>';
  }

  return { kur, seritHtml, filigranHtml, ayarHtml, PROFIL };
})();
