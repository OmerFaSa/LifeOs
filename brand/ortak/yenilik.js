/* NE DEĞİŞTİ? — katalog 17 (T5, belgeler/ekip/EKIP-PLANI.md §4.2).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/yenilik.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi
   `yenilik.css`.

   Güncellemeden sonraki İLK açılışta sayfanın başında tek kart: yeni,
   düzeltilen ve kaldırılan. «Kapat» deyince bir daha görünmez.

   Yalnız GERÇEK bir güncellemede görünür: bu cihazda daha önce başka
   bir sürüm görülmüşse. İlk kez açan kullanıcı «ne değişti» sorusunu
   sormaz (hiçbir şeyi eskisinden bilmiyor); ona sürüm sessizce
   kaydedilir. Kayıt tarayıcının `localStorage`'ındadır; yazılamazsa kart
   hiç çıkmaz — hata vermez, veri tutmaz.

   YENİ BİR SÜRÜMDE: `surum`u değiştir ve listeyi baştan yaz. Madde
   yalnız KULLANICININ GÖRDÜĞÜ şeyi söyler; «refaktör» madde değildir.
   `moduller` verilmezse madde üç arayüz için de doğrudur. */
window.LIFEOS.PARCA.yazilar({
  'ortak.yenilik.ne-degisti':'Ne değişti?',
  'ortak.yenilik.kapat':'Kapat',
});

window.LIFEOS.PARCA.yazilar({
  'ortak.yenilik.sekiz-cekmece-bugun-plan-cal':'Sekiz çekmece: Bugün, Plan, Çalışma, Analiz, Onaylar, Ofis, Kütüphanem, Ayarlar. Her ekranın yolu sayfanın başında yazar.',
  'ortak.yenilik.onaylar-bekleyen-butun-oneri':'Onaylar: bekleyen bütün öneriler tek yerde; Bugün yalnız en öndekini gösterir.',
  'ortak.yenilik.bugun-uc-alan-simdi-durum':'Bugün üç alan: şimdi, durum ve tek öneri. Geri kalan satırlar «Ayrıntı»da.',
  'ortak.yenilik.ayarlarda-arama-kaydedilmemi':'Ayarlarda arama, kaydedilmemiş değişiklik şeridi ve «Varsayılana dön».',
  'ortak.yenilik.her-tiklamada-sayfanin-basta':'Her tıklamada sayfanın baştan kayarak gelmesi: artık yalnız yeni ekranda.',
  'ortak.yenilik.bir-ekran-cizilemediginde-ci':'Bir ekran çizilemediğinde çıkan kırmızı hata: artık sakin bir kart ve verinin yerinde olduğu.',
  'ortak.yenilik.yedi-palet-ve-bes-duzen':'Yedi palet ve beş düzen: tek tasarım, tema Açık · Koyu · Sistem.',
  'ortak.yenilik.ekran-icindeki-sekmeler-bolu':'Ekran içindeki sekmeler: bölümler artık alt alta, bölüm çubuğuyla gezilir.',
});


window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.YENILIK = (function(){
  const SURUM = '2026-09-24';
  const MADDELER = [
    { tur:'yeni', metin:yz('ortak.yenilik.sekiz-cekmece-bugun-plan-cal') },
    { tur:'yeni', metin:yz('ortak.yenilik.onaylar-bekleyen-butun-oneri') },
    { tur:'yeni', metin:yz('ortak.yenilik.bugun-uc-alan-simdi-durum') },
    { tur:'yeni', metin:yz('ortak.yenilik.ayarlarda-arama-kaydedilmemi') },
    { tur:'duzeltilen', metin:yz('ortak.yenilik.her-tiklamada-sayfanin-basta') },
    { tur:'duzeltilen', metin:yz('ortak.yenilik.bir-ekran-cizilemediginde-ci') },
    { tur:'kaldirilan', metin:yz('ortak.yenilik.yedi-palet-ve-bes-duzen') },
    { tur:'kaldirilan', metin:yz('ortak.yenilik.ekran-icindeki-sekmeler-bolu') },
  ];
  const BASLIK = { yeni:'Yeni', duzeltilen:'Düzeltilen', kaldirilan:'Kaldırılan' };

  function anahtar(modul){ return 'lifeos.yenilik.' + String(modul || 'genel'); }
  function oku(modul){ try{ return window.localStorage.getItem(anahtar(modul)); }catch(e){ return undefined; } }
  function yaz(modul, v){ try{ window.localStorage.setItem(anahtar(modul), v); return true; }catch(e){ return false; } }
  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  function maddeler(modul){
    return MADDELER.filter(m => !m.moduller || m.moduller.indexOf(modul) >= 0);
  }

  /* Gösterilmeli mi? İlk açılışta (kayıt yok) sürümü sessizce yazar.
     o.yeniKullanici: kurulum bitmemiş — «ne değişti» ona anlamsız. */
  function gosterilmeliMi(modul, o){
    o = o || {};
    const son = oku(modul);
    if(son === undefined) return false;            // depo yok: hiç gösterme
    if(son === null || o.yeniKullanici){ if(son !== SURUM) yaz(modul, SURUM); return false; }
    return son !== SURUM && maddeler(modul).length > 0;
  }

  function kartHtml(modul){
    const m = maddeler(modul);
    const grup = Object.keys(BASLIK).map(t => {
      const l = m.filter(x => x.tur === t);
      if(!l.length) return '';
      return '<div class="yenilik__grup"><h3 class="yenilik__baslik yenilik__baslik--' + t + '">' + BASLIK[t] + '</h3>'
        + '<ul>' + l.map(x => '<li>' + kac(x.metin) + '</li>').join('') + '</ul></div>';
    }).join('');
    return '<section class="yenilik" data-yenilik data-oz="017" aria-labelledby="yenilik-ad">'
      + ('<header class="yenilik__bas"><h2 class="yenilik__ad" id="yenilik-ad">' + yz('ortak.yenilik.ne-degisti') + '</h2>')
      + ('<button type="button" class="btn btn--sm" data-yenilik-kapat>' + yz('ortak.yenilik.kapat') + '</button></header>')
      + '<div class="yenilik__govde">' + grup + '</div></section>';
  }

  /* Her çizimden sonra: kapatılana kadar sayfanın başında durur. */
  let acik = null;   // bu oturumda gösterilecek mi (ilk çağrıda karar verilir)
  function yerlestir(kok, o){
    o = o || {};
    if(acik === null) acik = gosterilmeliMi(o.modul, o);
    if(!acik || !kok) return false;
    const main = kok.querySelector('#main');
    if(!main || main.querySelector('[data-yenilik]')) return false;
    main.insertAdjacentHTML('afterbegin', kartHtml(o.modul));
    const k = main.querySelector('[data-yenilik-kapat]');
    if(k) k.addEventListener('click', () => kapat(o.modul));
    return true;
  }
  function kapat(modul){
    yaz(modul, SURUM);
    acik = false;
    document.querySelectorAll('[data-yenilik]').forEach(e => e.remove());
  }

  return { SURUM, MADDELER, maddeler, gosterilmeliMi, kartHtml, yerlestir, kapat,
    _sifirla(){ acik = null; } };
})();
