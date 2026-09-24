/* KABUK — üç arayüzün aynı iskeleti (ekip/EKIP-PLANI.md §3, T2).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kabuk.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Kopyayı elle
   düzenleme. Biçimi `brand/ortak/kabuk.css` içindedir.
   ==================================================================

   NE ÇİZER (katalog, ekip/TASARIM-OZELLIKLERI.md)

     ÜST ÇUBUK   modül geçiş menüsü (08) · sekiz çekmece · Onaylar'ın mor
                 sayacı (115) · ara ⌘K (13) · zil (09) · bağlantı noktası
                 (118) · rütbe çipi (140) · profil
     GÜN ŞERİDİ  zaman ekseni ve şimdi çizgisi (151) · modül şeridi (01) ·
                 tarihe dokununca hafta (05) · telefonda sabit etiket (163)
     SAYFA BAŞI  yol («Plan › Hafta») · başlık · tek cümle · eylemler
     BÖLÜM       çekmecenin bölümleri arasında gezinme (19'un kabuk yarısı)
     TELEFON     alt bant: Bugün · Plan · Çalışma · Menü (169) · sağ altta
                 + (166) · ana eylem başparmak bölgesinde (160)
     GEÇİŞ       sistem değişince üst çizgi yeni sistemin rengini alır (155)

   NEDEN TEK DOSYA

   Kural «üç modülde aynı iskelet, aynı çekmece adları» (CEKMECE-HARITASI).
   Her modül kendi üst çubuğunu yazsaydı, adlar ve sıra bir gün ayrışırdı ve
   bu ancak iki sekme yan yana açılınca görülürdü. Burada yalnız ÇİZİM var:
   hangi çekmecede hangi ekran olduğunu, rozet sayılarını ve rütbeyi modül
   verir; bu dosya ne bir depoya dokunur ne ağa çıkar (AGENTS.md §1.4).

   Eylemler (`data-act`) modülün app.js'indeki genel işleyicilere düşer:
     go · open-palette · open-appearance · toggle-sidebar      (vardı)
     modul-menu · bildirim-ac · hafta-ac · hizli-ekle           (yeni)
   Açılır paneller (modül menüsü, bildirimler, hızlı ekle, görünüm) tek
   katman yöneticisinden geçer: dışarı tıklayınca, Esc'de ve pencere
   boyutu değişince kapanır. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  /* Sekiz çekmece — ad ve sıra KULLANICI KARARIDIR (EKIP-PLANI §8-1). */
  const CEKMECELER = Object.freeze([
    { id:'bugun',     ad:'Bugün' },
    { id:'plan',      ad:'Plan' },
    { id:'calisma',   ad:'Çalışma' },
    { id:'analiz',    ad:'Analiz' },
    { id:'onaylar',   ad:'Onaylar' },
    { id:'ofis',      ad:'Ofis' },
    { id:'kutuphane', ad:'Kütüphanem' },
    { id:'ayarlar',   ad:'Ayarlar' },
  ]);

  /* Dört sistem. Kapı numaraları kök `sunucu.py` SISTEMLER ile aynıdır
     (tek sunucuyla açılınca sistemler bu kapılardadır). Başka bir yoldan
     açılmış sayfada öteki sistemin adresi BİLİNMEZ ve uydurulmaz. */
  const MODULLER = Object.freeze({
    ays:{ harf:'A', ad:'AYS',    uzun:'Akademik Yol Sistemi',      not:'sınav hazırlığı',        kapi:4173 },
    spi:{ harf:'S', ad:'SPİ',    uzun:'Sağlık Performans İzleyicisi', not:'uyku, beslenme, hareket', kapi:4183 },
    esp:{ harf:'E', ad:'ESP',    uzun:'Entelektüel Seviye Planlayıcı', not:'dil, felsefe, müzik',    kapi:4193 },
    mer:{ harf:'M', ad:'Merkez', uzun:'Hayat Kontrol Merkezi',     not:'üçünün özeti',            kapi:4200 },
  });
  const SIRA = ['ays', 'spi', 'esp', 'mer'];

  /* Kabuğun kendi simge takımı. Modüllerin simge kümeleri farklı; kabuk
     üçünde aynı görünsün diye simgesini kendisi taşır. */
  const SIMGE = {
    bugun:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    plan:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    calisma:'<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5M9 13h6M9 16.5h4"/>',
    analiz:'<path d="M5 20v-8M12 20V5M19 20v-5"/>',
    onaylar:'<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8.5 12.5l2.5 2.5 4.5-5.5"/>',
    ofis:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.4-3 2.7-5 5.5-5s5.1 2 5.5 5"/><path d="M15.5 5.5a3.2 3.2 0 0 1 0 6.2M20.5 19.5c-.3-2.2-1.5-3.8-3.3-4.6"/>',
    kutuphane:'<path d="M5 19.5V5.5a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h12"/><path d="M9 8h6"/>',
    ayarlar:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    ara:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    zil:'<path d="M6.5 16v-4.5a5.5 5.5 0 0 1 11 0V16l1.5 2h-14z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    menu:'<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',
    arti:'<path d="M12 5v14M5 12h14"/>',
    asagi:'<path d="M7 10l5 5 5-5"/>',
    kapat:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  };

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  function simge(ad){
    const y = SIMGE[ad];
    if(!y) return '';
    return '<svg class="kbk-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + y + '</svg>';
  }

  function modulIsareti(k, buyuk){
    const m = MODULLER[k];
    if(!m) return '';
    return '<span class="modis modis--' + k + (buyuk ? ' modis--lg' : '') + '" data-oz="165" role="img" aria-label="'
      + kac(m.ad) + '">' + m.harf + '</span>';
  }

  /* Öteki sistemin adresi: yalnız tek sunucunun kapılarından biriyle
     açılmışsak bilinir. file:// ile açılmış tek dosyada, ya da başka bir
     sunucuda, adres UYDURULMAZ (AGENTS.md §1.7). */
  function adres(k, loc){
    loc = loc || window.location;
    const m = MODULLER[k];
    if(!m || !loc || !/^https?:$/.test(loc.protocol || '')) return null;
    const kapi = Number(loc.port);
    const bizim = SIRA.some(x => MODULLER[x].kapi === kapi);
    if(!bizim) return null;
    return loc.protocol + '//' + loc.hostname + ':' + m.kapi + '/';
  }

  /* Şimdi çizgisinin yeri: günün uyanık diliminde (varsayılan 06–24) oran. */
  function simdiOrani(d, bas, son){
    d = d || new Date();
    bas = bas == null ? 6 : bas;
    son = son == null ? 24 : son;
    const s = d.getHours() + d.getMinutes() / 60;
    return Math.max(0, Math.min(1, (s - bas) / (son - bas)));
  }

  function saatMetni(d){
    d = d || new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ================================================== ÜST ÇUBUK */

  function cekmeceDugmesi(c, telefon){
    const on = !!c.on;
    const sayac = c.sayac ? '<span class="ust__sayac" data-oz="115" data-h-sayi="cekmece:' + kac(c.id) + '" aria-label="' + kac(c.sayac + ' bekleyen') + '">'
      + kac(c.sayac) + '</span>' : '';
    return '<button class="ust__cekmece' + (on ? ' is-on' : '') + '" data-act="go" data-route="' + kac(c.route) + '"'
      + ' data-cekmece="' + kac(c.id) + '"' + (on ? ' aria-current="page"' : '') + '>'
      + simge(c.id) + '<span class="ust__cekmece-ad">' + kac(c.ad) + '</span>' + sayac + '</button>';
  }

  function baglantiNoktasi(b){
    b = b || {};
    const d = b.durum || 'kapali';
    const metin = d === 'bagli' ? 'Merkez bağlı' + (b.saat ? ' · ' + b.saat : '')
      : d === 'ulasilamadi' ? 'Merkeze ulaşılamadı' + (b.saat ? ' · son deneme ' + b.saat : '') + ' — her şey çalışıyor'
      : d === 'bekliyor' ? 'Merkez açık, henüz gönderim olmadı — her şey çalışıyor'
      : 'Merkez kapalı — her şey çalışıyor';
    return '<button class="ust__bag ust__bag--' + kac(d) + '" data-oz="118" data-act="go" data-route="'
      + kac(b.route || 'guide') + '" title="' + kac(metin) + '" aria-label="' + kac(metin) + '">'
      + '<i aria-hidden="true"></i>'
      + (d === 'bagli' && b.saat ? '<span class="ust__bag-saat">' + kac(b.saat) + '</span>' : '')
      + '</button>';
  }

  function rutbeCipi(r){
    if(!r || !r.etiket || r.etiket === '—') return '';
    const oran = Math.round(Math.max(0, Math.min(1, Number(r.oran) || 0)) * 100);
    const muhur = '<span class="ust__muhur" aria-hidden="true"'
      + (r.renk ? ' style="--kademe-renk:' + kac(r.renk) + (r.gorsel ? ';--kademe-gorsel:url(&quot;' + kac(r.gorsel) + '&quot;)' : '') + '"' : '')
      + '><span>' + kac(r.kademe == null ? '' : r.kademe) + '</span></span>';
    const ayrinti = r.tamam ? 'en üst basamak' : (r.icindeMetin || r.icinde) + '/' + (r.gerekenMetin || r.gereken);
    const etiket = 'Rütbe ' + (r.ad || '') + ' ' + r.etiket + ', ' + ayrinti;
    return '<button class="ust__rutbe" data-oz="140" data-act="go" data-route="' + kac(r.route || 'rutbe') + '"'
      + ' aria-label="' + kac(etiket) + '" title="' + kac(etiket) + '">'
      + muhur
      + '<b class="ust__rutbe-ad"><span class="ust__rutbe-kademe">' + kac(r.ad || '') + ' </span>' + kac(r.etiket) + '</b>'
      + '<small class="ust__rutbe-xp">' + kac(ayrinti) + '</small>'
      + '<span class="ust__rutbe-cizgi" aria-hidden="true"><i style="width:' + oran + '%"></i></span>'
      + '</button>';
  }

  /* o: { modul, cekmeceler:[{id, ad, route, on, sayac}], onay:{sayi, route},
          bildirim:{sayi, acil}, baglanti:{durum, saat, route}, rutbe, profil:{harf, ad} } */
  function ustCubuk(o){
    o = o || {};
    const m = MODULLER[o.modul] || MODULLER.ays;
    const liste = (o.cekmeceler || []).map(c => cekmeceDugmesi(c)).join('');
    const onay = o.onay || {};
    const bil = o.bildirim || {};
    const prof = o.profil || {};
    const harf = (prof.harf || (prof.ad || '').trim().charAt(0) || '·').toLocaleUpperCase('tr-TR');
    return '<header class="ust" data-modul="' + kac(o.modul || 'ays') + '">'
      + '<div class="ust__ic">'
      + '<button class="ust__marka" data-oz="008" data-act="modul-menu" aria-haspopup="dialog"'
      +   ' aria-label="' + kac(m.ad + ' — sistemler arası geçiş') + '">'
      +   modulIsareti(o.modul || 'ays', true)
      +   '<span class="ust__marka-ad">' + kac(m.ad) + '</span>' + simge('asagi') + '</button>'
      /* Küçülen başlık (154): içini hareket.js sayfa başlığından doldurur;
         sayfanın h1'i yerinde durduğu için ekran okuyucuya ikinci kez okunmaz. */
      + '<span class="ust__baslik" aria-hidden="true"></span>'
      + '<nav class="ust__nav" aria-label="Çekmeceler">' + liste + '</nav>'
      + '<div class="ust__sag">'
      +   (onay.sayi ? '<button class="ust__onay" data-oz="115" data-act="go" data-route="' + kac(onay.route || 'onaylar') + '"'
      +     ' aria-label="' + kac(onay.sayi + ' öneri onay bekliyor') + '">' + simge('onaylar')
      +     '<span class="ust__sayac" data-h-sayi="onay">' + kac(onay.sayi) + '</span></button>' : '')
      +   '<button class="ust__ara" data-oz="013" data-act="open-palette" aria-label="Ara ve komut (Ctrl+K)">'
      +     simge('ara') + '<span class="ust__ara-yazi">Ara</span><kbd>Ctrl K</kbd></button>'
      +   '<button class="ust__zil" data-oz="009" data-act="bildirim-ac" aria-haspopup="dialog"'
      +     ' aria-label="' + kac(bil.sayi ? 'Bildirimler, ' + bil.sayi + ' tane' : 'Bildirimler, yok') + '">'
      +     simge('zil') + (bil.acil ? '<i class="ust__zil-nokta" aria-hidden="true"></i>' : '') + '</button>'
      +   baglantiNoktasi(o.baglanti)
      +   rutbeCipi(o.rutbe)
      +   '<button class="ust__profil" data-act="open-appearance" aria-haspopup="dialog"'
      +     ' aria-label="' + kac('Profil ve görünüm' + (prof.ad ? ' — ' + prof.ad : '')) + '">' + kac(harf) + '</button>'
      +   '<button class="ust__menu" data-act="toggle-sidebar" aria-label="Menü">' + simge('menu') + '</button>'
      + '</div></div></header>';
  }

  /* ================================================== GÜN ŞERİDİ */

  const SAAT_ETIKETI = [6, 9, 12, 15, 18, 21, 24];

  /* o: { tarih:'Per 24 Eyl', simdi:Date, bas, son,
          seritler:[{ modul, bloklar:[{ ad, dk, durum:'bitti'|'suruyor'|'bekliyor' }], ozet }],
          kalan:Number|null, hafta:[{ ad, gun, bugun, gelecek, noktalar:[{modul, durum}] }] | null,
          haftaAcik:boolean } */
  function gunSeridi(o){
    o = o || {};
    const simdi = o.simdi || new Date();
    const bas = o.bas == null ? 6 : o.bas, son = o.son == null ? 24 : o.son;
    const yuzde = (simdiOrani(simdi, bas, son) * 100).toFixed(2);
    const saat = saatMetni(simdi);
    const saatler = SAAT_ETIKETI.filter(h => h >= bas && h <= son).map(h =>
      '<span class="gunserit__saat" style="left:' + ((h - bas) / (son - bas) * 100).toFixed(2) + '%">'
      + String(h === 24 ? 0 : h).padStart(2, '0') + '</span>').join('');
    const seritler = (o.seritler || []).filter(s => s && MODULLER[s.modul]).map(s => {
      const bloklar = (s.bloklar || []).map(b => '<i class="gunserit__blok gunserit__blok--' + kac(b.durum || 'bekliyor') + '"'
        + ' style="flex-grow:' + Math.max(1, Number(b.dk) || 1) + '" title="' + kac(b.ad || '') + '"></i>').join('');
      return '<div class="gunserit__serit gunserit__serit--' + s.modul + '" data-oz="001">'
        + modulIsareti(s.modul)
        + '<span class="gunserit__bloklar" aria-hidden="true">' + bloklar + '</span>'
        + (s.ozet ? '<span class="gunserit__ozet">' + kac(s.ozet) + '</span>' : '')
        + '</div>';
    }).join('');
    const kalan = o.kalan == null ? '' : '<span class="gunserit__kalan"><b>' + kac(o.kalan) + '</b> iş kaldı</span>';
    const acik = !!o.haftaAcik;
    const hafta = acik && o.hafta ? haftaSeridi(o.hafta) : '';
    return '<div class="gunserit' + (acik ? ' is-acik' : '') + '">'
      + '<div class="gunserit__kaydir">'
      + '<div class="gunserit__ic">'
      + '<button class="gunserit__etiket" data-oz="163 005" data-act="hafta-ac" aria-expanded="' + (acik ? 'true' : 'false') + '"'
      +   ' aria-label="' + kac((o.tarih || 'Bugün') + ' — haftayı ' + (acik ? 'kapat' : 'aç')) + '">'
      +   '<span>' + kac(o.tarih || 'Gün') + '</span>' + simge('asagi') + '</button>'
      + '<div class="gunserit__iz" data-oz="151" role="img" aria-label="' + kac('Günün ' + bas + '–' + son + ' dilimi, şimdi ' + saat) + '">'
      +   '<span class="gunserit__gecmis" style="width:' + yuzde + '%"></span>'
      +   '<span class="gunserit__eksen"></span>'
      +   saatler
      +   '<span class="gunserit__simdi" style="left:' + yuzde + '%"><b>' + saat + '</b></span>'
      + '</div>'
      + seritler
      + kalan
      + '</div></div>'
      + hafta
      + '</div>';
  }

  function haftaSeridi(gunler){
    return '<div class="gunserit__hafta" data-oz="005" role="list" aria-label="Bu hafta">'
      + gunler.map(g => {
        const noktalar = (g.noktalar || []).map(n => '<i class="gunserit__nokta gunserit__nokta--' + kac(n.modul)
          + ' is-' + kac(n.durum || 'bos') + '" title="' + kac((MODULLER[n.modul] || {}).ad + ': '
          + ({ tamam:'tamam', eksik:'eksik kaldı', bos:'kayıt yok', gelecek:'henüz gelmedi' })[n.durum || 'bos']) + '"></i>').join('');
        return '<div class="gunserit__gun' + (g.bugun ? ' is-bugun' : '') + (g.gelecek ? ' is-gelecek' : '') + '" role="listitem"'
          + (g.bugun ? ' aria-current="date"' : '') + '>'
          + '<span class="gunserit__gun-ad">' + kac(g.ad) + '</span>'
          + '<b class="gunserit__gun-no">' + kac(g.gun) + '</b>'
          + '<span class="gunserit__noktalar">' + noktalar + '</span></div>';
      }).join('')
      + '</div>';
  }

  /* ================================================== SAYFA BAŞI · BÖLÜM */

  /* o: { yol:['Plan','Hafta'], baslik, ozet(HTML), eylem(HTML) }
     Başlık `hero__title` sınıfını da taşır: duman testi ve envanter
     ekranın başlığını o adla okuyor (H'nin araçları). */
  function sayfaBasi(o){
    o = o || {};
    const yol = (o.yol || []).filter(Boolean);
    return '<div class="sayfabasi">'
      + '<div class="sayfabasi__metin">'
      + (yol.length > 1 ? '<p class="sayfabasi__yol">' + yol.map(kac).join('<span aria-hidden="true"> › </span>') + '</p>' : '')
      + '<h1 class="sayfabasi__baslik hero__title">' + (o.baslikHtml || kac(o.baslik || '')) + '</h1>'
      + (o.ozet ? '<p class="sayfabasi__ozet">' + o.ozet + '</p>' : '')
      + '</div>'
      + (o.eylem ? '<div class="sayfabasi__eylem">' + o.eylem + '</div>' : '')
      + '</div>';
  }

  /* o: { cekmece:'Plan', bolumler:[{ route, ad, on, rozet:{text, quiet} }] }
     Tek bölümlü çekmecede çizilmez: tek seçenekli bir şerit seçim değil
     gürültüdür. */
  function bolumCubugu(o){
    o = o || {};
    const b = o.bolumler || [];
    if(b.length < 2) return '';
    return '<nav class="bolumcubugu" data-oz="019" aria-label="' + kac((o.cekmece || '') + ' bölümleri') + '">'
      + b.map(x => '<button class="bolumcubugu__ad' + (x.on ? ' is-on' : '') + '" data-act="go" data-route="' + kac(x.route) + '"'
        + (x.on ? ' aria-current="page"' : '') + '>' + kac(x.ad)
        + (x.rozet ? '<span class="bolumcubugu__rozet' + (x.rozet.quiet ? ' is-sessiz' : '') + '"'
          + ' aria-label="' + kac(x.rozet.text + ' bekleyen') + '">' + kac(x.rozet.text) + '</span>' : '')
        + '</button>').join('')
      + '</nav>';
  }

  /* ================================================== TELEFON */

  /* o: { sekmeler:[{ id, ad, route | act, on }] } — dört sekme; Menü bir
     eylemdir (alt çekmeceyi açar), yönlendirme değil. */
  function altBant(o){
    o = o || {};
    return '<nav class="altbant" data-oz="169 160" aria-label="Hızlı gezinme">'
      + (o.sekmeler || []).map(s => {
        const hedef = s.route ? ' data-act="go" data-route="' + kac(s.route) + '"' : ' data-act="' + kac(s.act) + '"';
        return '<button class="altbant__sekme' + (s.on ? ' is-on' : '') + '"' + hedef
          + (s.on ? ' aria-current="page"' : '') + '>' + simge(s.id) + '<span>' + kac(s.ad) + '</span></button>';
      }).join('')
      + '</nav>'
      + '<button class="hizliekle" data-oz="166" data-act="hizli-ekle" aria-haspopup="dialog" aria-label="Hızlı ekle">'
      + simge('arti') + '</button>';
  }

  /* Menü (telefonda alt bandın dördüncü sekmesi, dar masaüstünde üst
     çubuğun menü düğmesi): sekiz çekmece ve bölümleri tek listede.
     o: { cekmeceler:[{ id, ad, sayac, bolumler:[{ route, ad, on }] }], ayak(HTML) } */
  function menuSayfasi(o){
    o = o || {};
    const govde = (o.cekmeceler || []).map(c => '<section class="menusayfa__cekmece">'
      + '<h2 class="menusayfa__ad">' + simge(c.id) + '<span>' + kac(c.ad) + '</span>'
      + (c.sayac ? '<span class="ust__sayac" aria-label="' + kac(c.sayac + ' bekleyen') + '">' + kac(c.sayac) + '</span>' : '')
      + '</h2><div class="menusayfa__bolumler">'
      + (c.bolumler || []).map(b => '<button class="menusayfa__bolum' + (b.on ? ' is-on' : '') + '" data-act="go"'
        + ' data-route="' + kac(b.route) + '"' + (b.on ? ' aria-current="page"' : '') + '>' + kac(b.ad) + '</button>').join('')
      + '</div></section>').join('');
    return '<div class="menusayfa" role="dialog" aria-modal="true" aria-label="Menü">'
      + '<div class="menusayfa__bas"><b>Menü</b>'
      + '<button class="menusayfa__kapat" data-act="toggle-sidebar" aria-label="Menüyü kapat">' + simge('kapat') + '</button></div>'
      + '<nav class="menusayfa__govde" aria-label="Bütün çekmeceler">' + govde + '</nav>'
      + (o.ayak ? '<div class="menusayfa__ayak">' + o.ayak + '</div>' : '')
      + '</div>';
  }

  /* ================================================== AÇILIR PANELLER */

  /* Modül geçiş menüsü (08). o: { modul, durumlar:{ ays:'metin', … }, loc } */
  function modulMenusu(o){
    o = o || {};
    const satir = k => {
      const m = MODULLER[k];
      const bu = k === o.modul;
      const url = bu ? null : adres(k, o.loc);
      const durum = bu ? 'bu sekmede açık' : ((o.durumlar || {})[k] || (url ? m.not : 'ayrı dosyada açılır'));
      const ic = modulIsareti(k, true)
        + '<span class="kmenu__metin"><b>' + kac(m.ad) + '</b><small>' + kac(m.uzun) + ' · ' + kac(durum) + '</small></span>';
      if(bu) return '<div class="kmenu__satir is-bu" aria-current="true">' + ic + '</div>';
      if(!url) return '<div class="kmenu__satir is-kapali">' + ic + '</div>';
      return '<a class="kmenu__satir" href="' + kac(url) + '" data-modul-gecis="' + k + '">' + ic + '</a>';
    };
    return '<div class="katman kmenu" role="dialog" aria-label="Sistemler">'
      + '<p class="kmenu__bas">LifeOS</p>'
      + SIRA.map(satir).join('')
      + '</div>';
  }

  /* Gruplu bildirimler (09). o: { gruplar:[{ modul, satirlar:[{ metin, route, act, data, acil }] }] }
     Modül grupları önce, Merkez önerileri ayrı kümede en sonda. */
  function bildirimPaneli(o){
    o = o || {};
    const gr = (o.gruplar || []).filter(g => g && g.satirlar && g.satirlar.length);
    const sirali = gr.filter(g => g.modul !== 'mer').concat(gr.filter(g => g.modul === 'mer'));
    const govde = sirali.length ? sirali.map(g => {
      const m = MODULLER[g.modul] || { ad:g.modul };
      return '<section class="kmenu__grup kmenu__grup--' + kac(g.modul) + '">'
        + '<h2 class="kmenu__grup-bas">' + modulIsareti(g.modul) + '<span>' + kac(g.modul === 'mer' ? 'Merkez önerileri' : m.ad) + '</span></h2>'
        + g.satirlar.map(s => {
          const veri = Object.keys(s.data || {}).map(a => ' ' + kac(a) + '="' + kac(s.data[a]) + '"').join('');
          const hedef = s.route ? ' data-act="go" data-route="' + kac(s.route) + '"' : ' data-act="' + kac(s.act) + '"';
          return '<button class="kmenu__bildirim' + (s.acil ? ' is-acil' : '') + '"' + hedef + veri + '>'
            + kac(s.metin) + '</button>';
        }).join('')
        + '</section>';
    }).join('') : '<p class="kmenu__bos">Bekleyen bir şey yok.</p>';
    return '<div class="katman kmenu kmenu--bildirim" role="dialog" aria-label="Bildirimler">'
      + '<p class="kmenu__bas">Bildirimler</p>' + govde + '</div>';
  }

  /* Hızlı ekle yelpazesi (166). o: { modul, satirlar:[{ ad, act, data }], loc }
     Bu modülün en sık kayıtları; öteki sistemler yalnız adresleri
     biliniyorsa bağlantı olarak durur (kayıt kendi sistemine yazılır). */
  function hizliEkle(o){
    o = o || {};
    const kendi = (o.satirlar || []).map(s => {
      const veri = Object.keys(s.data || {}).map(a => ' ' + kac(a) + '="' + kac(s.data[a]) + '"').join('');
      return '<button class="kmenu__hizli" data-act="' + kac(s.act) + '"' + veri + '>'
        + modulIsareti(o.modul) + '<span>' + kac(s.ad) + '</span></button>';
    }).join('');
    const oteki = SIRA.filter(k => k !== o.modul && k !== 'mer').map(k => {
      const url = adres(k, o.loc);
      if(!url) return '';
      return '<a class="kmenu__hizli" href="' + kac(url) + '" data-modul-gecis="' + k + '">'
        + modulIsareti(k) + '<span>' + kac(MODULLER[k].ad + '\'de kaydet') + '</span></a>';
    }).join('');
    return '<div class="katman kmenu kmenu--hizli" role="dialog" aria-label="Hızlı ekle">' + kendi + oteki + '</div>';
  }

  /* ---------- katman yöneticisi ----------
     Tek seferde tek panel. Çapaya göre konumlanır, ekrandan taşarsa içeri
     çekilir. Telefonda (679 px ve altı) alttan açılır: başparmak bölgesi. */
  let acikId = null;
  let capa = null;

  function katmanAc(id, htmlMetin, anchor){
    katmanKapat();
    const kok = document.getElementById('overlay-root') || document.body;
    const kap = document.createElement('div');
    kap.innerHTML = String(htmlMetin);
    const panel = kap.firstElementChild;
    if(!panel) return null;
    panel.id = id;
    kok.appendChild(panel);
    acikId = id;
    capa = anchor || null;
    if(capa) capa.setAttribute('aria-expanded', 'true');
    if(!telefonMu() && anchor && anchor.getBoundingClientRect){
      const r = anchor.getBoundingClientRect();
      const w = panel.offsetWidth;
      let left = r.right - w;
      if(panel.classList.contains('kmenu') && r.left + w < window.innerWidth - 12 && r.left < window.innerWidth / 2) left = r.left;
      left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
      let top = r.bottom + 8;
      if(top + panel.offsetHeight > window.innerHeight - 12) top = Math.max(12, r.top - panel.offsetHeight - 8);
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
    }else{
      panel.classList.add('is-alttan');
    }
    const ilk = panel.querySelector('a[href], button');
    if(ilk && !panel.hasAttribute('data-odaksiz')){ try{ ilk.focus({ preventScroll:true }); }catch(e){} }
    return panel;
  }

  function katmanKapat(){
    if(!acikId) return false;
    const el = document.getElementById(acikId);
    if(el) el.remove();
    if(capa){
      capa.setAttribute('aria-expanded', 'false');
      if(capa.isConnected && document.activeElement === document.body){ try{ capa.focus({ preventScroll:true }); }catch(e){} }
    }
    acikId = null; capa = null;
    return true;
  }

  function katmanAcik(id){ return id ? acikId === id && !!document.getElementById(id) : !!acikId && !!document.getElementById(acikId); }

  /* Açıkken yeniden çizim (tema değişti) panelin yerinde kalsın diye. */
  function katmanTazele(id, htmlMetin){
    const el = document.getElementById(id);
    if(!el) return false;
    const kap = document.createElement('div');
    kap.innerHTML = String(htmlMetin);
    const yeni = kap.firstElementChild;
    yeni.id = id;
    yeni.style.left = el.style.left; yeni.style.top = el.style.top;
    if(el.classList.contains('is-alttan')) yeni.classList.add('is-alttan');
    el.replaceWith(yeni);
    return true;
  }

  function telefonMu(){
    try{ return window.matchMedia('(max-width: 679px)').matches; }catch(e){ return false; }
  }

  /* Modül geçiş rengi (155): bağlantıya basılınca üst çizgi yeni sistemin
     rengine döner, ad kısa bir geçişle değişir, sonra sayfa açılır.
     Azaltılmış harekette bekleme sıfırdır. */
  function gecis(k, url){
    const m = MODULLER[k];
    const ust = document.querySelector('.ust');
    const az = (() => { try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return true; } })();
    if(ust && m){
      ust.setAttribute('data-gecis', k);
      const ad = ust.querySelector('.ust__marka-ad');
      if(ad) ad.textContent = m.ad;
    }
    const git = () => { window.location.href = url; };
    if(az) git(); else setTimeout(git, 320);
  }

  let kuruldu = false;
  function kur(){
    if(kuruldu || typeof document === 'undefined') return;
    kuruldu = true;
    document.addEventListener('mousedown', e => {
      if(!acikId) return;
      const panel = document.getElementById(acikId);
      if(panel && panel.contains(e.target)) return;
      if(capa && capa.contains(e.target)) return;
      katmanKapat();
    });
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[data-modul-gecis]');
      if(!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      katmanKapat();
      gecis(a.getAttribute('data-modul-gecis'), a.href);
    });
    window.addEventListener('resize', () => { if(acikId && !telefonMu()) katmanKapat(); });
  }
  kur();

  L.KABUK = Object.freeze({
    CEKMECELER, MODULLER, SIRA,
    simge, modulIsareti, adres, simdiOrani, saatMetni,
    ustCubuk, gunSeridi, haftaSeridi, sayfaBasi, bolumCubugu, altBant, menuSayfasi,
    modulMenusu, bildirimPaneli, hizliEkle,
    katmanAc, katmanKapat, katmanAcik, katmanTazele, telefonMu, gecis,
  });
})();
