/* KABUK — üç arayüzün aynı iskeleti (belgeler/ekip/EKIP-PLANI.md §3, T2).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kabuk.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Kopyayı elle
   düzenleme. Biçimi `brand/ortak/kabuk.css` içindedir.
   ==================================================================

   NE ÇİZER (katalog, belgeler/ekip/TASARIM-OZELLIKLERI.md)

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
    bilgi:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.6v.1"/>',
    zil:'<path d="M6.5 16v-4.5a5.5 5.5 0 0 1 11 0V16l1.5 2h-14z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    muzik:'<path d="M9.5 17.5V6.5l9-2v11"/><circle cx="7" cy="17.5" r="2.5"/><circle cx="16" cy="15.5" r="2.5"/>',
    kenar:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
    gizli:'<rect x="4" y="4.5" width="16" height="5" rx="1.5"/><rect x="4" y="12.5" width="16" height="3" rx="1"/><path d="M4 19.5h7"/>',
    menu:'<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',
    arti:'<path d="M12 5v14M5 12h14"/>',
    asagi:'<path d="M7 10l5 5 5-5"/>',
    ileri:'<path d="M10 7l5 5-5 5"/>',
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

  /* ================================================== v5 · KENAR ÇUBUĞU
     LifeOS Tasarım Dili sürüm 5 (Kabuk anatomisi). Üst gezinme ve bölüm
     çubuğu kenar çubuğuna taşındı: modül geçişi · bağlam satırı · sekiz
     çekmece (açık olanın bölümleri altında) · Merkez bağlantısı · rütbe.
     Üstte yalnız ince bir şerit kalır: konum · ara · bildirim · profil.
     Hiçbir eylem kaybolmaz: modül menüsü markada, onay sayacı Onaylar'ın
     rozetinde, bağlantı ve rütbe kenarın dibinde (envanter aynı eylemleri
     görür). */

  /* Dört biçimli modül geçişi (008, 155): bu modül basılı; öteki sistemin
     adresi biliniyorsa bağlantıdır, bilinmiyorsa uydurulmaz. */
  /* SADE (kullanıcı, 2026-10-02: «sistem seçimlerini bir buton ile açılan
     pencerede seçtir»): kenarda tek düğme bu sistemi söyler; dört sistem
     düğmenin altında yumuşakça açılan küçük kartta, adları ve ne işe
     yaradıklarıyla. Kapalı kart odak almaz (visibility). */
  let modulPencereSayac = 0;
  function modulGecisi(modul, loc){
    const su = MODULLER[modul] || MODULLER.ays;
    const pid = 'kenar-sistemler-' + (++modulPencereSayac);
    const satir = (k, m) => '<i class="kenar__nokta kenar__nokta--' + k + '" aria-hidden="true"></i>'
      + '<span class="kenar__modul-metin"><span class="kenar__modul-ad">' + kac(m.ad) + '</span>'
      + '<span class="kenar__modul-not">' + kac(m.not) + '</span></span>';
    return '<div class="kenar__moduller" data-oz="008 155">'
      + '<button type="button" class="kenar__modulsec" aria-expanded="false" aria-controls="' + pid + '"'
      +   ' aria-label="' + kac('Sistem: ' + su.ad + ' — değiştir') + '" title="Sistem değiştir">'
      +   '<i class="kenar__nokta kenar__nokta--' + kac(modul || 'ays') + '" aria-hidden="true"></i>'
      +   '<span class="kenar__modulsec-ad">' + kac(su.ad) + '</span>'
      +   '<svg class="kenar__modulsec-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>'
      + '</button>'
      + '<div class="kenar__modulpencere" id="' + pid + '" role="group" aria-label="Sistemler"><div class="kenar__modulliste">'
      + SIRA.map(k => {
        const m = MODULLER[k];
        if(k === modul) return '<span class="kenar__modul is-on" aria-current="true">' + satir(k, m) + '</span>';
        const url = adres(k, loc);
        return url ? '<a class="kenar__modul" href="' + kac(url) + '" data-modul-gecis="' + k + '">' + satir(k, m) + '</a>'
          : '<span class="kenar__modul is-kapali" title="' + kac(m.ad + ' ayrı dosyada açılır') + '">' + satir(k, m) + '</span>';
      }).join('') + '</div></div></div>';
  }
  function modulPencereKapat(haric){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('.kenar__moduller.is-acik').forEach(m => {
      if(m === haric) return;
      m.classList.remove('is-acik');
      const b = m.querySelector('.kenar__modulsec');
      if(b) b.setAttribute('aria-expanded', 'false');
    });
  }

  /* o: { modul, baglam, loc,
          cekmeceler:[{ id, ad, route, on, sayac, bolumler:[{ route, ad, on, rozet }] }],
          baglanti:{ durum, saat, route }, rutbe } */
  /* Bölüm listesi yalnız ÇEKMECE DEĞİŞİNCE açılış hareketiyle gelir
     (kullanıcı, 2026-10-02: «daha animasyonlu açılsın»); aynı çekmecede
     her yeniden çizimde tekrar oynamaz. */
  let sonCekmece = null;
  /* SAYFA GEÇİŞİ (kullanıcı, 2026-10-02: «sisteme biraz animasyon kat»):
     sayfa değişince kök `sayfa-gecis` alır ve kartlar sırayla, hafifçe
     yukarı kayarak belirir (kabuk.css). Aynı sayfanın yeniden çizimi
     (bir sayaç, bir tik) hareketi tekrar oynatmaz. */
  /* Çekmece değişince ayrıca `cekmece-gecis`: başlık (çekmecenin adı) yalnız
     o zaman yeniden belirir; aynı çekmecede bölüm değişince başlık ve bölüm
     çubuğu yerinde durur, yalnız içerik gelir — çerçeve sabit, sayfa değişir. */
  let sonSayfa = null, gecisSaati = null;
  function sayfaGecisi(anahtar){
    if(anahtar === sonSayfa || typeof document === 'undefined') return;
    const cekmeceDegisti = String(anahtar).split(':')[0] !== String(sonSayfa).split(':')[0];
    sonSayfa = anahtar;
    const k = document.documentElement;
    k.classList.add('sayfa-gecis');
    k.classList.toggle('cekmece-gecis', cekmeceDegisti);
    if(gecisSaati) clearTimeout(gecisSaati);
    gecisSaati = setTimeout(() => { k.classList.remove('sayfa-gecis'); k.classList.remove('cekmece-gecis'); }, 900);
  }
  /* Kenar açıkken yapılan son çizimin zamanı (bkz. kur: «açık kaldı»). */
  let acikCizimZamani = 0;
  function kenarCubugu(o){
    o = o || {};
    const acik = (o.cekmeceler || []).find(c => c.on);
    const yeniCekmece = !!acik && acik.id !== sonCekmece;
    sonCekmece = acik ? acik.id : null;
    if(acik) sayfaGecisi(acik.id + ':' + (((acik.bolumler || []).find(b => b.on) || {}).route || acik.route));
    const cekHtml = c => {
      const sayac = c.sayac ? '<span class="kenar__sayac" data-oz="115" aria-label="' + kac(c.sayac + ' bekleyen') + '">'
        + kac(c.sayac) + '</span>' : '';
      const bol = c.on && (c.bolumler || []).length > 1
        ? '<div class="kenar__bolumler' + (yeniCekmece ? ' is-yeni' : '') + '" data-oz="019" role="group" aria-label="' + kac(c.ad + ' bölümleri') + '">'
          /* --i: sıra; açılışta bölümler yukarıdan aşağı tek tek gelir (kabuk.css «AYRAÇ»). */
          + c.bolumler.map((b, i) => '<button class="kenar__bolum' + (b.on ? ' is-on' : '') + '" data-act="go" data-route="' + kac(b.route) + '"'
            + ' style="--i:' + i + '"' + (b.on ? ' aria-current="page"' : '') + '>' + kac(b.ad)
            + (b.rozet ? '<span class="kenar__rozet' + (b.rozet.quiet ? ' is-sessiz' : '') + '" aria-label="' + kac(b.rozet.text + ' bekleyen') + '">'
              + kac(b.rozet.text) + '</span>' : '')
            + '</button>').join('')
          + '</div>' : '';
      return '<div class="kenar__cekmece-kap">'
        + '<button class="kenar__cekmece' + (c.on ? ' is-on' : '') + '" data-act="go" data-route="' + kac(c.route) + '"'
        /* Erişilebilir ad düğmenin kendisinde: dar kenarda görünen ad yoktur
           (kabuk.css), sayacı olan çekmece yalnız «3 bekleyen» diye okunurdu. */
        + ' data-cekmece="' + kac(c.id) + '" title="' + kac(c.ad) + '"'
        + ' aria-label="' + kac(c.ad + (c.sayac ? ', ' + c.sayac + ' bekleyen' : '')) + '"' + (c.on && !(c.bolumler || []).some(b => b.on && b.route !== c.route) ? ' aria-current="page"' : '') + '>'
        + simge(c.id) + '<span class="kenar__ad">' + kac(c.ad) + '</span>' + sayac + '</button>' + bol + '</div>';
    };
    /* Sekiz çekmece DÜZ listede (kullanıcı, 2026-10-03: «şu daha fazla
       kısmını da kaldır, bir işe yaramıyor»). Ofis ve Kütüphanem önceden
       «Daha fazla»nın altındaydı; hiçbiri kalkmadı, sıra ve adlar aynı. */
    const cek = (o.cekmeceler || []).map(cekHtml).join('');
    /* Kenar açıkken (fare üstünde ya da odak içinde) yeniden çizilirse —
       bir bölüme basınca olduğu gibi — açılış dizilişi TEKRAR oynamaz:
       çizim eski kenar hâlâ ekrandayken kurulur, açık olduğu buradan bilinir.
       Fare kenardan çıkınca sınıf düşer (kur), sonraki açılış yine dizilir. */
    const acikKaldi = typeof document !== 'undefined'
      && !!document.querySelector('.kenar:hover, .kenar:focus-within, .kenar.kenar--tutulu');
    if(acikKaldi) acikCizimZamani = Date.now();
    /* Kenardan açılmış bir katman açıkken yeniden çizim (tema değişti):
       kenar açık KALIR, katman havada asılı kalmaz. */
    const tutulu = kenarTutuluMu();
    return '<aside class="kenar' + (acikKaldi ? ' kenar--acik-kaldi' : '') + (tutulu ? ' kenar--tutulu' : '') + '" id="kenar" data-modul="' + kac(o.modul || 'ays') + '" aria-label="Gezinme">'
      + '<button class="kenar__marka" data-act="modul-menu" aria-haspopup="dialog" aria-label="LifeOS — sistemler arası geçiş">'
      +   '<i class="kenar__logo" aria-hidden="true"><b></b><b></b><b></b><b></b></i><span>LifeOS</span></button>'
      + modulGecisi(o.modul, o.loc)
      + (o.baglam ? '<p class="kenar__baglam">' + kac(o.baglam) + '</p>' : '')
      + '<nav class="kenar__nav" aria-label="Çekmeceler">' + cek + '</nav>'
      + '<div class="kenar__dip">' + kenarAraclari(o) + '</div></aside>';
  }

  /* KENARIN DİBİ (kullanıcı, 2026-10-02 gece: «yeşil yerdeki rank ve o
     kısmı kaldır, kırmızı yerdeki simgeleri oraya taşı»). Sağ üstün
     araçları burada; rütbe çipi ve Merkez satırı kenardan kalktı (rütbe
     Ayarlar › Rütbe'de, Merkez bağlantısı Ayarlar'da). Sınıflar üst
     şeritle aynı: gizle.js sayacı, ses.js durumu ve data-act işleyicileri
     iki yerde de aynen çalışır. Masaüstünde üst şerit yok, telefonda kenar
     yok: her genişlikte tek takım görünür (kabuk.css «ARAÇLAR KENARDA»). */
  function kenarAraclari(o){
    const bil = o.bildirim || {};
    const prof = o.profil || {};
    const ad = (prof.ad || '').trim();
    const harf = (prof.harf || ad.charAt(0) || '·').toLocaleUpperCase('tr-TR');
    const etiket = s => '<span class="kenar__ad">' + kac(s) + '</span>';
    return '<div class="kenar__araclar" role="group" aria-label="Araçlar">'
      + '<button class="ust__ara kenar__arac" type="button" data-oz="013" data-act="open-palette" aria-label="Ara ve komut (Ctrl+K)" title="Ara (Ctrl K)">'
      +   simge('ara') + etiket('Ara') + '</button>'
      + '<button class="ust__gizli kenar__arac" type="button" aria-haspopup="dialog" aria-expanded="false"'
      +   ' aria-label="Sayfa düzeni" title="Sayfa düzeni: sırala, küçült, gizle">'
      +   simge('gizli') + '<i class="ust__gizli-sayi" aria-hidden="true"></i>' + etiket('Sayfa düzeni') + '</button>'
      + ustSes(true)
      + '<button class="ust__zil kenar__arac" type="button" data-oz="009" data-act="bildirim-ac" aria-haspopup="dialog"'
      +   ' aria-label="' + kac(bil.sayi ? 'Bildirimler, ' + bil.sayi + ' tane' : 'Bildirimler, yok') + '">'
      +   simge('zil') + (bil.acil || bil.sayi ? '<i class="ust__zil-nokta" aria-hidden="true"></i>' : '') + etiket('Bildirimler') + '</button>'
      + '<button class="ust__profil kenar__arac kenar__arac--profil" type="button" data-act="open-appearance" aria-haspopup="dialog"'
      +   ' aria-label="' + kac('Profil ve görünüm' + (ad ? ' — ' + ad : '')) + '">'
      +   '<i class="kenar__avatar" aria-hidden="true">' + kac(harf) + '</i>' + etiket(ad || 'Profil') + '</button>'
      + '</div>';
  }

  /* İnce üst şerit. o: { modul, yol:[…], bildirim:{ sayi, acil }, profil,
     onay:{ sayi, route }, rutbe } — onay ve rütbe yalnız telefonda
     görünür (masaüstünde kenar çubuğundadırlar). */
  function ustSerit(o){
    o = o || {};
    const m = MODULLER[o.modul] || MODULLER.ays;
    const yol = (o.yol || []).filter(Boolean);
    const bil = o.bildirim || {};
    const prof = o.profil || {};
    const harf = (prof.harf || (prof.ad || '').trim().charAt(0) || '·').toLocaleUpperCase('tr-TR');
    const onay = o.onay || {};
    const r = o.rutbe;
    /* SOL ÜST BOŞ (kullanıcı, 2026-10-02: «sol üstteki ESP'yi ve o kutucuk
       işaretini sil»). Kenar düğmesi kalktı: kenar hep ince şerittir,
       üzerine gelince ya da klavyeyle odaklanınca açılır (kabuk.css).
       Konum satırı yalnız ekran okuyucuda kalır (görünmez): sayfanın adı
       başlıkta, bölüm seçicide söylenir. */
    return '<header class="ust ust--v5" data-modul="' + kac(o.modul || 'ays') + '">'
      + '<div class="ust__ic">'
      + '<nav class="ust__yol" aria-label="Konum"><i class="kenar__nokta kenar__nokta--' + kac(o.modul || 'ays') + '" aria-hidden="true"></i>'
      +   '<span class="ust__yol-modul">' + kac(m.ad) + '</span>'
      +   yol.map((y, i) => '<span class="ust__yol-ayrac" aria-hidden="true">/</span><span class="ust__yol-oge' + (i === yol.length - 1 ? ' is-son' : '') + '">' + kac(y) + '</span>').join('')
      + '</nav>'
      + '<div class="ust__sag">'
      +   (onay.sayi ? '<button class="ust__onay ust--telefon" data-act="go" data-route="' + kac(onay.route || 'onaylar') + '"'
      +     ' aria-label="' + kac(onay.sayi + ' öneri onay bekliyor') + '"><i aria-hidden="true"></i>' + kac(onay.sayi) + '</button>' : '')
      /* Sağ üst sade (kullanıcı, 2026-10-02): arama yalnız simge; kısayol
         erişilebilir adda ve ipucunda. */
      +   '<button class="ust__ara" data-oz="013" data-act="open-palette" aria-label="Ara ve komut (Ctrl+K)" title="Ara (Ctrl K)">'
      +     simge('ara') + '</button>'
      /* Gizlenen/küçültülen bölümler (brand/ortak/gizle.js): düğme burada,
         sayısını ve panelini gizle.js yönetir. */
      +   '<button class="ust__gizli" type="button" aria-haspopup="dialog" aria-expanded="false"'
      +     ' aria-label="Sayfa düzeni" title="Sayfa düzeni: sırala, küçült, gizle">'
      +     simge('gizli') + '<i class="ust__gizli-sayi" aria-hidden="true"></i></button>'
      /* Radyo ve tık sesleri (brand/ortak/ses.js): düğme burada, durumunu
         (çalıyor · bağlanıyor · dokun, sürsün) ve panelini ses.js yönetir. */
      +   ustSes()
      +   '<button class="ust__zil" data-oz="009" data-act="bildirim-ac" aria-haspopup="dialog"'
      +     ' aria-label="' + kac(bil.sayi ? 'Bildirimler, ' + bil.sayi + ' tane' : 'Bildirimler, yok') + '">'
      +     simge('zil') + (bil.acil || bil.sayi ? '<i class="ust__zil-nokta" aria-hidden="true"></i>' : '') + '</button>'
      +   (r && r.etiket && r.etiket !== '—' ? '<button class="ust__madalya ust--telefon" data-act="go" data-route="' + kac(r.route || 'rutbe') + '"'
      +     ' aria-label="' + kac('Rütbe ' + (r.ad || '') + ' ' + r.etiket) + '"><i class="kenar__madalya" aria-hidden="true"'
      +     (r.renk ? ' style="--kademe-renk:' + kac(r.renk) + '"' : '') + '></i></button>' : '')
      +   '<button class="ust__profil" data-act="open-appearance" aria-haspopup="dialog"'
      +     ' aria-label="' + kac('Profil ve görünüm' + (prof.ad ? ' — ' + prof.ad : '')) + '">' + kac(harf) + '</button>'
      +   '<button class="ust__menu" data-act="toggle-sidebar" aria-label="Menü">' + simge('menu') + '</button>'
      + '</div></div></header>';
  }

  function ustSes(kenarda){
    const S = L.SES;
    const d = (S && S.dugme ? S.dugme() : null) || { sinif:'', etiket:'Radyo ve sesler', ipucu:'Radyo' };
    return '<button class="ust__ses' + (kenarda ? ' kenar__arac' : '') + kac(d.sinif) + '" type="button" aria-haspopup="dialog"'
      + ' aria-expanded="' + (katmanAcik('kabuk-ses') ? 'true' : 'false') + '"'
      + ' aria-label="' + kac(d.etiket) + '" title="' + kac(d.ipucu) + '">'
      + simge('muzik') + '<i class="ust__ses-nokta" aria-hidden="true"></i>'
      + (kenarda ? '<span class="kenar__ad">Radyo</span>' : '') + '</button>';
  }

  /* Modüllerin tek çağrısı: ustCubuk'a verilen nesnenin aynısı + her
     çekmecenin bölümleri, konum ve bağlam satırı. */
  function iskeletV5(o){ return kenarCubugu(o) + ustSerit(o); }

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

  /* o: { yol:['Plan','Hafta'], baslik, ozet(HTML), eylem(HTML), oz, bilgiOz }
     `bilgiOz`: bilgi kartının ilk satırının katalog numarası (Bugün'ün
     günün cümlesi, 004 — başlık çekmecenin adı olunca cümle karta indi).
     Başlık `hero__title` sınıfını da taşır: duman testi ve envanter
     ekranın başlığını o adla okuyor (H'nin araçları). */
  /* SAYFA BAŞI SADE (kullanıcı, 2026-10-02: «böyle bilgiler başlığın sağ
     üstünde hafif bir bilgi kartı olsun; böyle tarih yazmasın»). Ekranda
     yalnız başlık ve eylemler durur. Açıklama (`ozet`) ve durum satırı
     (`ust`) başlığın yanındaki ⓘ'dedir: üzerine gelince, dokununca ya da
     odakla hafif bir kart açılır; Esc ve dışarı tıklamak kapatır. Söylenecek
     bir şey yoksa düğme de yoktur. */
  let bilgiSayac = 0;
  function sayfaBasi(o){
    o = o || {};
    const yol = (o.yol || []).filter(Boolean);
    const bid = 'sb-bilgi-' + (++bilgiSayac);
    const bilgi = o.ozet || o.ust
      ? '<div class="sayfabasi__bilgi">'
        + '<button type="button" class="sayfabasi__bilgi-dugme" aria-expanded="false" aria-controls="' + bid + '"'
        +   ' aria-label="Bu sayfa hakkında" title="Bu sayfa hakkında">' + simge('bilgi') + '</button>'
        + '<div class="bilgikart" id="' + bid + '" role="note">'
        +   (o.ozet ? '<div class="bilgikart__metin"' + (o.bilgiOz ? ' data-oz="' + kac(o.bilgiOz) + '"' : '') + '>' + o.ozet + '</div>' : '')
        +   (o.ust ? '<div class="bilgikart__alt">' + o.ust + '</div>' : '')
        + '</div></div>'
      : '';
    return '<div class="sayfabasi">'
      + '<div class="sayfabasi__metin">'
      + (yol.length > 1 ? '<p class="sayfabasi__yol">' + yol.map(kac).join('<span aria-hidden="true"> › </span>') + '</p>' : '')
      + '<div class="sayfabasi__satir">'
      + '<h1 class="sayfabasi__baslik hero__title"' + (o.oz ? ' data-oz="' + kac(o.oz) + '"' : '') + '>' + (o.baslikHtml || kac(o.baslik || '')) + '</h1>'
      + bilgi
      + '</div></div>'
      + (o.eylem ? '<div class="sayfabasi__eylem">' + o.eylem + '</div>' : '')
      + '</div>';
  }
  /* «BU EKRAN NASIL OKUNUR» ⓘ'DE (iPhone planı §2.4, 2026-10-02). Ekranın
     sonundaki katlanır şerit (her modülün UI.rail'i) açıklamanın ikinci
     yeriydi ve her sayfaya bir satır ekliyordu. Çizimden sonra terimler
     sayfa başındaki bilgi kartına taşınır: ekranda satır kalmaz, hiçbir
     terim kaybolmaz (düğmeler aynı `data-act="hint"` ile aynı açıklamayı
     açar). Bilgi kartı olmayan ekranda şerit yerinde kalır. */
  function railBilgiye(kok){
    if(typeof document === 'undefined' || !kok) return false;
    /* Sayfa başı #main'in kardeşidir (aynı .sayfa içinde); başka sayfanın
       bilgi kartına taşınmasın diye yalnız orada aranır. */
    const kap = kok.parentElement;
    const kart = kap && kap.querySelector(':scope > .sayfabasi .sayfabasi__bilgi .bilgikart');
    const serit = Array.from(kok.querySelectorAll('section.rail'));
    if(!kart || !serit.length) return false;
    let tasindi = false;
    serit.forEach(r => {
      const terimler = Array.from(r.querySelectorAll('.railcard'));
      if(!terimler.length) return;
      let liste = kart.querySelector('.bilgikart__terimler');
      if(!liste){
        const ad = r.querySelector('.rail__label');
        const etiket = (ad && ad.textContent.trim()) || 'Bu ekran nasıl okunur';
        liste = document.createElement('div');
        liste.className = 'bilgikart__terimler';
        liste.setAttribute('role', 'group');
        liste.setAttribute('aria-label', etiket);
        const bas = document.createElement('div');
        bas.className = 'bilgikart__terimler-ad';
        bas.setAttribute('aria-hidden', 'true');
        bas.textContent = etiket;
        liste.appendChild(bas);
        kart.appendChild(liste);
      }
      terimler.forEach(t => liste.appendChild(t));
      r.remove();
      tasindi = true;
    });
    return tasindi;
  }

  /* KAYDIRMALI SEÇİCİ (2026-10-02): sığmayan bölüm çubuğunda seçili bölüm
     ortaya alınır — kaydırılmış bir çubukta seçiliyi aramak gerekmesin.
     Her çizimden sonra çağrılır (Gizle.uygula). */
  function seciciHazirla(kap){
    if(typeof document === 'undefined') return;
    (kap || document).querySelectorAll('.bolumcubugu').forEach(c => {
      const on = c.querySelector('.bolumcubugu__ad.is-on');
      if(!on || c.scrollWidth <= c.clientWidth + 1) return;
      /* Ekran koordinatıyla: offsetLeft çubuk konumlandırılmamışsa sayfaya
         göre ölçülür ve seçili yanlış yere kayardı. */
      const cr = c.getBoundingClientRect(), or = on.getBoundingClientRect();
      c.scrollLeft += (or.left + or.width / 2) - (cr.left + cr.width / 2);
    });
  }
  /* Komşu bölüm: yon +1 sağdaki, -1 soldaki. Yoksa null. */
  function seciciKomsu(c, yon){
    const l = Array.from(c.querySelectorAll('.bolumcubugu__ad'));
    const i = l.findIndex(b => b.classList.contains('is-on'));
    return i < 0 ? null : (l[i + yon] || null);
  }

  function bilgiKapat(haric){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('.sayfabasi__bilgi.is-acik').forEach(b => {
      if(b === haric) return;
      b.classList.remove('is-acik');
      const d = b.querySelector('.sayfabasi__bilgi-dugme');
      if(d) d.setAttribute('aria-expanded', 'false');
    });
  }

  /* o: { cekmece:'Plan', bolumler:[{ route, ad, on, rozet:{text, quiet} }], kabuk }
     Tek bölümlü çekmecede çizilmez: tek seçenekli bir şerit seçim değil
     gürültüdür. `kabuk:true`: sayfanın üstündeki tablet çubuğu — yalnız
     680–1279 pikselde görünür (kabuk.css), orada kenar çubuğu bölümleri
     göstermez; masaüstünde kenarda, telefonda Menü'de dururlar. */
  function bolumCubugu(o){
    o = o || {};
    const b = o.bolumler || [];
    if(b.length < 2) return '';
    return '<nav class="bolumcubugu' + (o.kabuk ? ' bolumcubugu--kabuk' : '') + '" data-oz="019" aria-label="' + kac((o.cekmece || '') + ' bölümleri') + '">'
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
     Modül grupları önce, Merkez önerileri ayrı kümede en sonda.
     BİÇİM (kullanıcı, 2026-10-03: «bildirim kısmı sol altta sıkışmasın,
     daha güzel tasarla»): başlık, toplam sayı ve kapat; her bildirim bir
     kart satırı (acil olan kırmızı çizgi ve «Acil» etiketiyle); boşken
     sakin bir boş ekran. Kenardan açılınca ekranın boyunca bir yan çekmece
     (.kmenu--yan, capaYerlestir); telefonda alttan açılır. */
  function bildirimPaneli(o){
    o = o || {};
    const gr = (o.gruplar || []).filter(g => g && g.satirlar && g.satirlar.length);
    const sirali = gr.filter(g => g.modul !== 'mer').concat(gr.filter(g => g.modul === 'mer'));
    const toplam = sirali.reduce((n, g) => n + g.satirlar.length, 0);
    const govde = sirali.length ? sirali.map(g => {
      const m = MODULLER[g.modul] || { ad:g.modul };
      return '<section class="kmenu__grup kmenu__grup--' + kac(g.modul) + '">'
        + '<h2 class="kmenu__grup-bas">' + modulIsareti(g.modul) + '<span>' + kac(g.modul === 'mer' ? 'Merkez önerileri' : m.ad) + '</span>'
        + '<small class="bildirim__grup-sayi">' + g.satirlar.length + '</small></h2>'
        + g.satirlar.map(s => {
          const veri = Object.keys(s.data || {}).map(a => ' ' + kac(a) + '="' + kac(s.data[a]) + '"').join('');
          const hedef = s.route ? ' data-act="go" data-route="' + kac(s.route) + '"' : ' data-act="' + kac(s.act) + '"';
          return '<button class="kmenu__bildirim' + (s.acil ? ' is-acil' : '') + '"' + hedef + veri + '>'
            + '<span class="bildirim__metin">' + kac(s.metin) + '</span>'
            + (s.acil ? '<span class="bildirim__acil">Acil</span>' : '')
            + simge('ileri') + '</button>';
        }).join('')
        + '</section>';
    }).join('') : '<div class="kmenu__bos bildirim__bos"><span class="bildirim__bos-simge" aria-hidden="true">' + simge('zil') + '</span>'
      + '<b>Bekleyen bir şey yok.</b><small>Yeni bir şey olunca burada görünür.</small></div>';
    return '<div class="katman kmenu kmenu--bildirim kmenu--yan" role="dialog" aria-label="Bildirimler">'
      + '<header class="bildirim__bas"><b>Bildirimler</b>'
      +   (toplam ? '<span class="bildirim__sayi" aria-label="' + toplam + ' bildirim">' + toplam + '</span>' : '')
      +   '<button type="button" class="bildirim__kapat" data-katman-kapat aria-label="Bildirimleri kapat">' + simge('kapat') + '</button>'
      + '</header>'
      + '<div class="bildirim__liste">' + govde + '</div></div>';
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

  /* KENARDAN AÇILAN KATMAN: kenar açık tutulur (.kenar--tutulu; fare
     katmana geçince kenar kapanıp katman havada kalmasın) ve katman
     kenarın AÇIK sağ kenarına, düğmenin alt hizasına yerleşir (araçlar
     kenarın dibinde: yukarı doğru açılır). gizle.js de kullanır. */
  let kenarTutan = false;
  function kenarTutuluMu(){
    return kenarTutan && typeof document !== 'undefined'
      && !!((acikId && document.getElementById(acikId)) || document.querySelector('.kmenu--gizle'));
  }
  function capaYerlestir(panel, anchor){
    const kenar = anchor && anchor.closest ? anchor.closest('.kenar') : null;
    if(!kenar || telefonMu()) return false;
    kenar.classList.add('kenar--tutulu');
    kenarTutan = true;
    const kr = kenar.getBoundingClientRect(), r = anchor.getBoundingClientRect();
    const acik = parseFloat(getComputedStyle(kenar).getPropertyValue('--kenar-acik')) || 216;
    const h = panel.offsetHeight, w = panel.offsetWidth;
    const left = Math.min(kr.left + acik + 10, Math.max(12, window.innerWidth - w - 12));
    panel.style.left = Math.round(left) + 'px';
    panel.style.right = 'auto';
    /* Yan çekmece (bildirimler): ekranın boyunca, dipte sıkışmaz. */
    if(panel.classList.contains('kmenu--yan')){
      panel.style.top = '12px';
      panel.style.bottom = '12px';
      return true;
    }
    const top = Math.max(12, Math.min(r.bottom - h, window.innerHeight - h - 12));
    panel.style.top = Math.round(top) + 'px';
    return true;
  }
  function kenarBirak(){
    kenarTutan = false;
    if(typeof document !== 'undefined') document.querySelectorAll('.kenar.kenar--tutulu').forEach(k => k.classList.remove('kenar--tutulu'));
  }

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
    if(capaYerlestir(panel, anchor)){ /* kenarın sağında, düğmenin hizasında */ }
    else if(!telefonMu() && anchor && anchor.getBoundingClientRect){
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
    /* İlk odak ilk İŞE gider; kapat düğmesi (başlıkta) atlanır. */
    const ilk = panel.querySelector('a[href]:not([data-katman-kapat]), button:not([data-katman-kapat])') || panel.querySelector('a[href], button');
    if(ilk && !panel.hasAttribute('data-odaksiz')){ try{ ilk.focus({ preventScroll:true }); }catch(e){} }
    return panel;
  }

  function katmanKapat(){
    if(!acikId) return false;
    const el = document.getElementById(acikId);
    if(el) el.remove();
    kenarBirak();
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
    const ust = document.querySelector('.kenar') || document.querySelector('.ust');
    const az = (() => { try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return true; } })();
    if(ust && m){
      ust.setAttribute('data-gecis', k);
      const ad = ust.querySelector('.ust__marka-ad');
      if(ad) ad.textContent = m.ad;
    }
    /* Ortak tercihler (animasyon, radyo) karşı kapıya adresle taşınır:
       kapılar ayrı köken, depoları ayrı (animasyon.js «MODÜLLER ARASI»).
       Adres gidiş anında kurulur: çalan radyo önce devredilir (ses.js
       `devret`), damgası taze gitsin. Merkez (HKM) bu betikleri yüklemez;
       ona taşınmaz. */
    const git = () => {
      const A = L.ANIMASYON, S = L.SES, modul = k !== 'mer';
      if(modul && S && S.devret) S.devret();
      window.location.href = modul && A && A.tasimaEkle ? A.tasimaEkle(url) : url;
    };
    if(az) git(); else setTimeout(git, 320);
  }

  /* KENAR ÇUBUĞU AÇILIR/KAPANIR (depo sahibinin isteği, 2026-09-27: «hep
     durup yer kaplamasın»). Kapalıyken yalnız simgelerin durduğu ince bir
     şerit kalır; seçim bu cihazda hatırlanır. Telefonda kenar çubuğu zaten
     yoktur (alt bant), düğme orada görünmez. */
  const KENAR_ANAHTAR = 'lifeos.kenar';
  function kenarDarMi(){
    return typeof document !== 'undefined' && document.documentElement.classList.contains('kenar-dar');
  }
  function kenarDar(v){
    if(typeof document === 'undefined') return;
    const dar = v == null ? !kenarDarMi() : !!v;
    document.documentElement.classList.toggle('kenar-dar', dar);
    try{ if(dar) localStorage.removeItem(KENAR_ANAHTAR); else localStorage.setItem(KENAR_ANAHTAR, 'acik'); }catch(e){}
    document.querySelectorAll('[data-kenar-ac]').forEach(b => {
      b.setAttribute('aria-expanded', dar ? 'false' : 'true');
      b.setAttribute('aria-label', 'Kenar çubuğunu ' + (dar ? 'aç' : 'daralt'));
    });
    return dar;
  }
  /* SADE (kullanici, 2026-10-01): kenar VARSAYILAN olarak dardir ve
     uzerine gelince acilir (kabuk.css). 2026-10-02'den beri kalici acma
     dugmesi yok (sol ust bos): eski 'acik' kaydi da dar acilir ve silinir;
     yoksa kenar dugmesiz, kapatilamaz bicimde acik kalirdi. */
  function kenarIlkDar(kayit){ return true; }
  if(typeof document !== 'undefined'){
    let kayit = null;
    try{ kayit = localStorage.getItem(KENAR_ANAHTAR); }catch(e){}
    if(kenarIlkDar(kayit)) document.documentElement.classList.add('kenar-dar');
    try{ if(kayit) localStorage.removeItem(KENAR_ANAHTAR); }catch(e){}
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
      /* Katmanın kendi kapat düğmesi (bildirimler). */
      if(e.target.closest && e.target.closest('[data-katman-kapat]')){ e.preventDefault(); katmanKapat(); return; }
      /* Sayfa başındaki bilgi kartı: düğme açar/kapatır, dışarısı kapatır. */
      const bd = e.target.closest && e.target.closest('.sayfabasi__bilgi-dugme');
      if(bd){
        const kap = bd.closest('.sayfabasi__bilgi');
        const ac = !kap.classList.contains('is-acik');
        bilgiKapat(kap);
        kap.classList.toggle('is-acik', ac);
        bd.setAttribute('aria-expanded', ac ? 'true' : 'false');
        return;
      }
      if(!(e.target.closest && e.target.closest('.bilgikart'))) bilgiKapat();
      /* Sistem seçimi: düğme kartı açar/kapatır, dışarısı kapatır. */
      const ms = e.target.closest && e.target.closest('.kenar__modulsec');
      if(ms){
        const kap = ms.closest('.kenar__moduller');
        const ac = !kap.classList.contains('is-acik');
        modulPencereKapat(kap);
        kap.classList.toggle('is-acik', ac);
        ms.setAttribute('aria-expanded', ac ? 'true' : 'false');
        return;
      }
      if(!(e.target.closest && e.target.closest('.kenar__modulpencere'))) modulPencereKapat();
      const k = e.target.closest && e.target.closest('[data-kenar-ac]');
      if(k){ e.preventDefault(); kenarDar(); return; }
      const a = e.target.closest && e.target.closest('a[data-modul-gecis]');
      if(!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      katmanKapat();
      gecis(a.getAttribute('data-modul-gecis'), a.href);
    });
    window.addEventListener('resize', () => { if(acikId && !telefonMu()) katmanKapat(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape'){ bilgiKapat(); modulPencereKapat(); } });
    /* Seçicide ok tuşları komşu bölüme odaklanır (Enter/boşluk seçer). */
    document.addEventListener('keydown', e => {
      if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const b = e.target.closest && e.target.closest('.bolumcubugu__ad');
      if(!b) return;
      const l = Array.from(b.parentElement.querySelectorAll('.bolumcubugu__ad'));
      const h = l[l.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1)];
      if(h){ e.preventDefault(); h.focus(); h.scrollIntoView({ block:'nearest', inline:'center' }); }
    });
    /* Seçicide sürükleme: SIĞAN (kaymayan) çubukta yatay sürükleme komşu
       bölüme geçirir — «ana giriş ortada, sağa sola kaydırırsın». Sığmayan
       çubuk doğal kaydırmasıyla kalır. */
    let kaydirma = null;
    document.addEventListener('pointerdown', e => {
      const c = e.target.closest && e.target.closest('.bolumcubugu');
      kaydirma = c && c.scrollWidth <= c.clientWidth + 1 ? { c, x:e.clientX, y:e.clientY } : null;
    }, { passive:true });
    document.addEventListener('pointerup', e => {
      if(!kaydirma) return;
      const { c, x, y } = kaydirma;
      kaydirma = null;
      const dx = e.clientX - x, dy = e.clientY - y;
      if(Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const h = seciciKomsu(c, dx < 0 ? 1 : -1);
      if(h) h.click();
    });
    /* Dar kenar kapanınca (fare çıkınca) açık sistem kartı da kapanır. */
    /* «Açık kaldı» işareti fare kenardan GERÇEKTEN çıkınca ya da dışarıdan
       girince düşer; sonraki açılış yine dizilir. Yeniden çizimden sonra
       olay eski (söküldü) kenardan gelebilir: işaret o yüzden ekrandaki
       kenardan silinir. Çizimden hemen sonra tarayıcı, fare yerindeyken bile
       «dışarıdan geldi» diyen bir olay yollar (söküldü düğümün yerine üst
       öğeyi koyar): o kısa pencerede olaylar yok sayılır. */
    const disarida = n => !!(n && n.isConnected && n.closest && !n.closest('.kenar'));
    const isaretiDusur = () => {
      if(Date.now() - acikCizimZamani < 400) return;
      document.querySelectorAll('.kenar.kenar--acik-kaldi').forEach(x => x.classList.remove('kenar--acik-kaldi'));
    };
    document.addEventListener('mouseout', e => {
      const k = e.target.closest && e.target.closest('.kenar');
      if(k && !(e.relatedTarget && k.contains(e.relatedTarget))){
        modulPencereKapat();
        if(disarida(e.relatedTarget)) isaretiDusur();
      }
    });
    document.addEventListener('mouseover', e => {
      if(e.target.closest && e.target.closest('.kenar') && disarida(e.relatedTarget)) isaretiDusur();
    });
  }
  kur();

  L.KABUK = Object.freeze({
    CEKMECELER, MODULLER, SIRA,
    simge, modulIsareti, adres, simdiOrani, saatMetni,
    ustCubuk, kenarCubugu, ustSerit, iskeletV5, gunSeridi, haftaSeridi, sayfaBasi, railBilgiye, seciciHazirla, seciciKomsu,
    bolumCubugu, altBant, menuSayfasi,
    modulMenusu, bildirimPaneli, hizliEkle,
    katmanAc, katmanKapat, katmanAcik, katmanTazele, telefonMu, gecis, kenarDar, kenarDarMi, kenarIlkDar,
    capaYerlestir, kenarBirak,
  });
})();
