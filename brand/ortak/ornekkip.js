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
window.LIFEOS.PARCA.yazilar({
  'ortak.ornekkip.ornek-veri':'Örnek veri.',
  'ortak.ornekkip.gordugun-kayitlar-gercek-deg':'Gördüğün kayıtlar gerçek değil; gerçek verin ayrı durur,',
  'ortak.ornekkip.degismez-ve-merkez-e-gitmez':'değişmez ve Merkez’e gitmez.',
  'ortak.ornekkip.ornek-veriden-cik':'Örnek veriden çık',
  'ortak.ornekkip.su-an-ornek-verideysin-cikin':'Şu an örnek verideysin. Çıkınca örnek kayıtlar silinir, gerçek profiline dönersin.',
  'ortak.ornekkip.sistemi-dolu-haliyle-gormek':'Sistemi dolu hâliyle görmek için örnek bir profil açılır. Gerçek verin ayrı anahtarda durur; ',
  'ortak.ornekkip.ornek-veriye-gec':'Örnek veriye geç',
});


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
      + ('<p class="ornek-serit__metin"><b>' + yz('ortak.ornekkip.ornek-veri') + '</b> ' + yz('ortak.ornekkip.gordugun-kayitlar-gercek-deg') + ' ')
      + (yz('ortak.ornekkip.degismez-ve-merkez-e-gitmez') + '</p>')
      + ('<button type="button" class="btn btn--sm" data-act="ornek-cik">' + yz('ortak.ornekkip.ornek-veriden-cik') + '</button></div>');
  }

  function filigranHtml(){
    return '<div class="ornek-filigran" aria-hidden="true"></div>';
  }

  /* Ayarlar › Veri satırının gövdesi; modül kendi kartına sarar. Tek
     düğme; etiketi sonucu söyler (022). */
  function ayarHtml(acik){
    return '<div class="ornek-ayar" data-oz="172"><p class="small muted">' + (acik
        ? yz('ortak.ornekkip.su-an-ornek-verideysin-cikin')
        : yz('ortak.ornekkip.sistemi-dolu-haliyle-gormek')
          + 'örnek veri ona hiçbir yolla karışmaz ve Merkez’e gitmez.') + '</p>'
      + '<div class="mt-10"><button type="button" class="btn btn--sm" data-act="' + (acik ? 'ornek-cik' : 'ornek-gir') + '">'
      + (acik ? yz('ortak.ornekkip.ornek-veriden-cik') : yz('ortak.ornekkip.ornek-veriye-gec')) + '</button></div></div>';
  }

  return { kur, seritHtml, filigranHtml, ayarHtml, PROFIL };
})();
