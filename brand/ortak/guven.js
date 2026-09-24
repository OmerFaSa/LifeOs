/* GÜVEN — yedek durumu, kalıcı silme kapısı, kayıt geçmişi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/guven.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   Biçimi `brand/ortak/kart.css` içindedir.
   ==================================================================

   NE YAPAR (katalog, ekip/TASARIM-OZELLIKLERI.md §K)

     173  Yedek durumu        son yedeğin yaşı, tarihi ve boyutu; iki
                              haftalık yedek izi; tek düğmeyle yedek.
                              Yedek yoksa «Henüz yedek yok» — tarih
                              uydurulmaz. Kural `yedek.js`'tedir; bu dosya
                              yalnız gösterir.
     177  Kalıcı silme kapısı kalıcı silme BÜYÜK aksiyondur: önce dönüş
                              noktası, sonra yazılı onay, düğmede silinecek
                              sayı («1.243 kaydı kalıcı sil»).
     179  Kayıt geçmişi       bir kaydın her değişikliği kaynağıyla: sen,
                              Merkez önerisi (senin onayınla), plan motoru,
                              içe aktarma. Merkez değiştirmez, önerir;
                              uygulayan hep bellidir (AGENTS.md §1.4).

   Bu dosya depoya dokunmaz ve hiçbir şeyi silmez: durumu okur, kapıyı
   çizer, kararı (düğme açık mı) verir. Silen ve yedek alan modülün kendi
   kodudur. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const sayiMi = v => typeof v === 'number' && isFinite(v);
  const bicim = (n, od) => (L.SAYI && L.SAYI.bicim) ? L.SAYI.bicim(n, od) : (sayiMi(n) ? String(n) : '—');
  const zamanMetni = (z, simdi) => (L.SAYI && L.SAYI.zamanMetni) ? L.SAYI.zamanMetni(z, simdi) : String(z || '');

  /* ------------------------------------------------ 173 yedek */

  /* Bayt → okunur boyut. Bilinmiyorsa null: «0 KB» yazmak, boyutu
     ölçülmemiş bir yedeği boş gibi gösterirdi. */
  function boyutMetni(bayt){
    if(!sayiMi(bayt) || bayt < 0) return null;
    if(bayt < 1024) return bicim(bayt) + ' B';
    if(bayt < 1024 * 1024) return bicim(Math.round(bayt / 1024 * 10) / 10) + ' KB';
    return bicim(Math.round(bayt / (1024 * 1024) * 10) / 10) + ' MB';
  }

  /* d = { damga, boyut (bayt), iz:[damga…] (isteğe bağlı), kayit, bugun:'YYYY-AA-GG' }
     `yas` ve `gerekli` kararı `yedek.js`'ten gelir (tek kural). */
  function yedekDurumu(d){
    d = d || {};
    const yasFn = L.yedekYasi, gerekFn = L.yedekGerekli;
    const yas = d.damga && yasFn ? yasFn(d.damga, d.bugun) : null;
    const var_ = yas !== null;
    return {
      var:var_,
      yas:yas,
      gerekli:gerekFn ? gerekFn(yas, d.kayit) : false,
      yasMetni:var_ ? (L.SAYI ? L.SAYI.yasMetni(yas) : yas + ' gün önce') : null,
      zaman:var_ ? zamanMetni(d.damga, d.simdi) : null,
      boyut:var_ ? boyutMetni(d.boyut) : null,
    };
  }

  /* Son on dört gün: yedek alınan gün dolu. İz verilmezse çizilmez —
     kaydı tutulmayan bir geçmiş boş gün gibi gösterilmez. */
  function yedekIzi(iz, bugun, gun){
    if(!Array.isArray(iz) || !L.GRAFIK) return null;
    return L.GRAFIK.doluluk({ modul:'yedek', gunler:iz }, { bitis:bugun, gun:gun || 14 });
  }

  function yedekHtml(d){
    d = d || {};
    const r = yedekDurumu(d);
    let govde;
    if(!r.var){
      govde = '<p class="yedek__bas">Henüz yedek yok</p>';
    }else{
      govde = '<p class="yedek__bas">Son yedek ' + kac(r.yasMetni) + '</p>'
        + '<p class="yedek__alt">' + kac(r.zaman) + ' · '
        + (r.boyut ? kac(r.boyut) : 'boyut kayıtlı değil') + '</p>';
    }
    const iz = r.var ? yedekIzi(d.iz, d.bugun) : null;
    const izHtml = iz ? '<div class="yedek__iz" role="img" aria-label="' + kac('Son ' + iz.gun + ' günde '
      + iz.dolu + ' yedek günü') + '">' + iz.kutular.map(k => '<i class="doluluk__k'
      + (k.dolu ? ' doluluk__k--dolu' : '') + '" data-tarih="' + k.tarih + '"></i>').join('') + '</div>' : '';
    return '<div class="yedek' + (r.gerekli ? ' yedek--gerekli' : '') + '" data-oz="173">' + govde + izHtml
      + '<button type="button" class="btn btn--sm" data-act="yedek-al"><span class="btn__label">Şimdi yedek al</span></button>'
      + '</div>';
  }

  /* ------------------------------------------------ 177 silme */

  /* Kalıcı silme her zaman büyük aksiyondur: geri alınamaz (§1.9). */
  const SILME_SEVIYE = 'buyuk';

  /* Yazılı onay: silinecek SAYI yazılır. «SİL» yazdırılmaz — «İ» her
     klavyede yoktur ve yanlış harfle takılan kullanıcı neden
     ilerleyemediğini anlamaz; sayı ise silinecek şeyin büyüklüğünü bir
     kez daha okutur. Nokta, boşluk ve virgül yok sayılır (1.243 = 1243). */
  function yazilanGecerliMi(yazilan, sayi){
    if(!sayiMi(sayi)) return false;
    const y = String(yazilan == null ? '' : yazilan).replace(/[\s.,]/g, '');
    return y !== '' && y === String(sayi);
  }

  /* Kapının durumu: hangi adımda, düğme açık mı, ne eksik. */
  function silmeDurumu(o){
    o = o || {};
    const eksik = [];
    if(!sayiMi(o.sayi) || o.sayi <= 0) eksik.push('sayi');
    if(!o.donusNoktasi) eksik.push('donus');
    if(!yazilanGecerliMi(o.yazilan, o.sayi)) eksik.push('onay');
    const adim = eksik.indexOf('donus') >= 0 ? 'donus' : eksik.indexOf('onay') >= 0 ? 'onay' : 'hazir';
    return { seviye:SILME_SEVIYE, adim:eksik.indexOf('sayi') >= 0 ? 'yok' : adim, dugmeAcik:!eksik.length, eksik:eksik };
  }

  /* o = { nesne:'kaydı', sayi:1243, donusNoktasi:{ zaman } | null, yazilan, id } */
  function silmeHtml(o){
    o = o || {};
    const r = silmeDurumu(o);
    const id = 'silme-' + String(o.id || 'k').replace(/[^a-zA-Z0-9_-]/g, '');
    const say = sayiMi(o.sayi) ? bicim(o.sayi) : '—';
    const d1 = o.donusNoktasi
      ? '<li class="silme__adim silme__adim--tamam">Dönüş noktası alındı'
        + (o.donusNoktasi.zaman ? ' · ' + kac(zamanMetni(o.donusNoktasi.zaman)) : '') + '</li>'
      : '<li class="silme__adim">Önce dönüş noktası al: silinen geri getirilemez, yalnız bu noktaya dönülebilir.'
        + ' <button type="button" class="btn btn--sm" data-act="silme-donus"><span class="btn__label">Dönüş noktası al</span></button></li>';
    const d2 = '<li class="silme__adim' + (r.eksik.indexOf('onay') < 0 ? ' silme__adim--tamam' : '') + '">'
      + '<label for="' + id + '">Onaylamak için silinecek sayıyı yaz: <b>' + kac(say) + '</b></label>'
      + '<input class="silme__giris" id="' + id + '" inputmode="numeric" autocomplete="off" data-act="silme-yaz"'
      + (o.donusNoktasi ? '' : ' disabled') + ' value="' + kac(o.yazilan || '') + '"></li>';
    const dugme = (L.ONERI && L.ONERI.yikiciDugme)
      ? L.ONERI.yikiciDugme({ fiil:'kalıcı sil', sayi:o.sayi, nesne:o.nesne, act:'silme-onay' })
      : '<button type="button" class="btn btn--danger" data-act="silme-onay">' + kac(say + ' ' + (o.nesne || '') + ' kalıcı sil') + '</button>';
    return '<div class="silme" data-oz="177" data-seviye="buyuk" data-adim="' + r.adim + '">'
      + '<ol class="silme__adimlar">' + d1 + d2 + '</ol>'
      + (r.dugmeAcik ? dugme : dugme.replace('<button ', '<button disabled aria-disabled="true" '))
      + '</div>';
  }

  /* ------------------------------------------------ 179 geçmiş */

  /* Kaynaklar. Öneriyle gelen değişiklik (Merkez, ofis, kural) bir ONAY
     taşır: ya elle onay ya da kullanıcının «sormadan uygula» ayarı (116).
     Onayı olmayan öneri kaynaklı değişiklik gizlenmez; uyarıyla yazılır —
     çünkü doktrine göre olmaması gereken şeydir (AGENTS.md §1.4). */
  const KAYNAKLAR = Object.freeze({
    kullanici:{ ad:'Sen', oneri:false },
    merkez:{ ad:'Merkez önerisi', oneri:true },
    ofis:{ ad:'Ofis önerisi', oneri:true },
    kural:{ ad:'Kural motoru önerisi', oneri:true },
    plan:{ ad:'Plan motoru', oneri:false },
    'ice-aktarma':{ ad:'İçe aktarma', oneri:false },
  });

  /* olay = { zaman, kaynak, alan, eski, yeni, onay:{ tur:'onay'|'ayar', zaman } } */
  function kaynakMetni(olay){
    const k = olay && Object.prototype.hasOwnProperty.call(KAYNAKLAR, olay.kaynak) ? KAYNAKLAR[olay.kaynak] : null;
    if(!k) return { metin:'kaynağı bilinmiyor', uyari:'bilinmiyor' };
    if(!k.oneri) return { metin:k.ad, uyari:null };
    const o = olay.onay;
    if(o && o.tur === 'onay') return { metin:k.ad + ' (senin onayınla)', uyari:null };
    if(o && o.tur === 'ayar') return { metin:k.ad + ' (senin ayarınla, sormadan)', uyari:null };
    return { metin:k.ad + ' · onay kaydı yok', uyari:'onaysiz' };
  }

  const degerMetni = v => v == null || v === '' || (typeof v === 'number' && !isFinite(v)) ? '—'
    : (sayiMi(v) ? bicim(v) : String(v));

  function gecmis(olaylar){
    return (olaylar || []).filter(Boolean).slice().sort((a, b) =>
      String(b.zaman || '').localeCompare(String(a.zaman || '')));
  }

  function gecmisHtml(olaylar, o){
    o = o || {};
    const liste = gecmis(olaylar);
    if(!liste.length) return '<p class="gecmis gecmis--bos" data-oz="179">Bu kaydın değişiklik geçmişi yok.</p>';
    return '<ol class="gecmis" data-oz="179">' + liste.map(x => {
      const k = kaynakMetni(x);
      return '<li class="gecmis__s"' + (k.uyari ? ' data-uyari="' + k.uyari + '"' : '')
        + ' data-kaynak="' + kac(x.kaynak || '') + '">'
        + '<span class="gecmis__zaman">' + kac(x.zaman ? zamanMetni(x.zaman, o.simdi) : 'zaman kayıtlı değil') + '</span>'
        + '<span class="gecmis__kaynak">' + kac(k.metin) + '</span>'
        + '<span class="gecmis__degisim">' + (x.alan ? '<span class="gecmis__alan">' + kac(x.alan) + '</span> ' : '')
        + kac(degerMetni(x.eski)) + ' → ' + kac(degerMetni(x.yeni)) + '</span></li>';
    }).join('') + '</ol>';
  }

  L.GUVEN = {
    SILME_SEVIYE:SILME_SEVIYE,
    KAYNAKLAR:KAYNAKLAR,
    boyutMetni:boyutMetni,
    yedekDurumu:yedekDurumu,
    yedekIzi:yedekIzi,
    yedekHtml:yedekHtml,
    yazilanGecerliMi:yazilanGecerliMi,
    silmeDurumu:silmeDurumu,
    silmeHtml:silmeHtml,
    kaynakMetni:kaynakMetni,
    gecmis:gecmis,
    gecmisHtml:gecmisHtml,
  };
})();
