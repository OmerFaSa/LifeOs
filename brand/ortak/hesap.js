/* HESAP — PC sunucusuyla giriş ve eşitleme (sistem/hesap.py).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/hesap.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi
   `hesap.css`; düğmeyi kabuk çizer (kabuk.js ustHesap), durumunu ve
   panelini bu dosya yönetir (ses.js ile aynı kalıp).
   ==================================================================

   Depo sahibinin kararı (2026-10-04): PC, telefon ve tablet aynı hesapla
   girer; verinin kopyası PC'deki LifeOS sunucusunda durur. Cihaz
   çevrimdışıyken değişiklik sıraya girer, sunucuya ulaşınca oraya akar.

   Sözler:
   1. MODÜL ONSUZ DA ÇALIŞIR. Sunucu yoksa, kapalıysa ya da cevap
      vermezse hiçbir ekran beklemez, hiçbir veri kaybolmaz (AGENTS §1.4'ün
      sunucu karşılığı). Bütün ağ işi arkada ve zaman aşımıyla.
   2. ÖNCE CİHAZ. Her yazma önce bu cihazın deposuna iner (store.js); bu
      dosya yalnız «hangi yol ne zaman değişti»yi sıraya yazar. Sıra bu
      cihazın deposundadır: sayfa kapansa da kaybolmaz.
   3. İLK EŞİTLEME EZMEZ. Bir alan bu cihazda ilk kez bir hesaba bağlanınca
      yerel kayıtlar «ilk» işaretiyle gider: sunucuda olan kalır (PC'deki
      gerçek kayıt telefondaki denemeyle ezilmez), sunucudaki sürüm cihaza
      iner. Bağlanmadan önceki değişiklik sıraya girmez; ilk eşitleme
      hepsini zaten taşır.
   4. TEK GİRİŞ, ÜÇ MODÜL. Oturum sayfanın makinesine ait bir çerezdedir;
      çerez kapı numarasına bakmaz: aynı cihazdaki AYS, SPİ ve ESP birlikte
      girer, birlikte çıkar. Jeton hiçbir ekrana, günlüğe, adres satırına
      yazılmaz; sunucuya yalnız Authorization başlığıyla gider.
   5. BİR CİHAZ, BİR HESAP. Bu cihazdaki bir alan bir hesaba bağlandıysa
      başka bir hesapla girilince o alan eşitlenmez ve bu söylenir:
      birinin verisi ötekinin hesabına akmaz.
   6. ÖRNEK PROFİL EŞİTLENMEZ.
   7. KAYITTA SON YAZAN KAZANIR (sunucu sözü 2). Uzaktan gelen kayıt, bu
      cihazda daha yeni bir değişikliği sırada bekleyen yolun üstüne
      yazılmaz.
   8. FOTOĞRAFLAR EŞİTLENMEZ: tarayıcının ayrı deposundadır (foto.js) ve
      bu sürümde çekildiği cihazda kalır. Panel bunu söyler.
   9. YAZILAN SİLİNMEZ, KAYDET EN YENİNİN ÜSTÜNE YAZAR (2026-10-05).
      Uzaktan kayıt gelince model hemen tazelenir (modülün `yukle`'si);
      ekran (`yenile`) kullanıcı yazarken ya da yazıp henüz kaydetmemişken
      beklenir — odak alandan çıkmış olsa da (telefonda klavye kapandı).
      Açık bir kağıt ikisini de bekletir. Eskiden ikisi birlikte
      bekliyordu: «Kaydet» eski modelden kurulan kaydı yazıp öteki
      cihazın az önce gelen değişikliğini eziyordu. Aynı denetim arka
      plan yoklamalarına da açıktır (cizIste): King'in teklifleri ve
      haftalık özet veriyi hemen koyar, ekranı yazı bitince çizer.
  10. AYNI DEĞER EKRANI YENİLEMEZ. Uzaktan gelen kayıt bu cihazdakiyle
      aynıysa yazılmaz, ekran yenilenmez: değişmemiş bir kaydı yeniden
      yazan bir cihaz öteki cihazları durmadan yenilemesin.
  11. ÖNCE ANA MENÜ (depo sahibi, 2026-10-05: «giriş kısmında ilk ana
      menü gelsin»). Giriş ekranı formla değil karşılamayla açılır: bu
      cihazda girilmiş hesaplar, «Giriş yap», «Hesap oluştur», beta.
      Hatırlanan hesap yalnız ad, görünen ad ve renktir (çerez); şifre
      ve jeton hatırlanmaz. «×» onu bu cihazdan unutur.
  12. HESAP SAYFASI (aynı gün: «çok daha ayarlı; ücretli sürümler,
      kişisel hesap ayarları»). Profil, plan, cihazlar, güvenlik,
      eşitleme ve (admin) yönetim tek sayfada, iOS Ayarlar gibi
      gruplu. Plan yalnız görünürlüktür (sunucu sözü 8): hiçbir şey
      plana bakmaz. Sayfa sunucuya ulaşamazsa son bilineni gösterir,
      modülü bekletmez.
  13. SİLİNEN HESAP CİHAZI KİLİTLEMEZ (ikinci tur: etkinlik, özet, verin,
      kişisel bilgiler). Bir alan, bağlandığı hesabın adıyla birlikte
      rastgele KİMLİĞİNİ de saklar. Aynı adla girilip kimlik farklıysa
      eski hesap silinip yeniden açılmıştır (adlar tekildir); başka adla
      girilince sunucuya «o kimlik hâlâ var mı» diye sorulur. Eski hesap
      yoksa bağ çözülür ve cihazdaki veri yeni hesaba İLK EŞİTLEMEYLE
      gider (söz 3: sunucudakini ezmez). Eski hesap varsa söz 5 geçerli.
  14. KİŞİSEL BİLGİ YALNIZ OKUNDUĞU YERDE. Hitap ve doğum günü King'in
      selamına girer; başka hiçbir hesaba, plana, karara girmez. Sunucu
      cevabı gelmeden kişisel alanlar formda çizilmez: boş form
      kaydedilip var olan bilgi silinmesin.
  15. SEÇİM SAYFASI TİTREMEZ (depo sahibi, 2026-10-06: «hesap girme kısmına
      gelmeden önce milisaniyelik ilk o seçim ekranını gösteriyor»). Sayfa
      (sunucu.py) kartları `giris-hazir` gelene dek gizler; karar ağ
      beklemeden verilebiliyorsa (oturum, beta, uygulama) hemen verilir,
      yoksa sunucu cevabıyla. Kapı çekilirken solar, kartlar aynı anda
      belirir («beta girişine tıklayınca animasyonla gelsin»). Modüllerin
      minik özetleri (söz 16) kartlarda döner.
  16. ÖZET ETİKETİYLE VE ZAMANIYLA. Modüller ayrı kapıda: seçim sayfası
      onların deposunu okuyamaz; Bugün'ün dönen maddeleri kapıya bakmayan
      çereze yazılır (ozetYaz, vitrin.js donen). Her sayı kesinliğini
      taşır, kartta «ne zamanın» özeti olduğu yazar; yedi günden eskisi
      gösterilmez. Eksik sayı yazılmaz (sıfır değildir). Örnek profil
      yazmaz (modül vermez). Çerez bu cihazdan yalnız kullanıcının kendi
      LifeOS sunucusuna gider.

   BAĞLANTILAR (depo sahibi, 2026-10-08: «hesap özelliğini çok daha
   profesyonel yap; bazı uygulamaları ücretsiz bağlayabilelim»; sunucu
   sözleri 14–17). Hiçbiri şirket hesabı, ücret ya da internet istemez.
  17. İKİ ADIMLI DOĞRULAMA. Şifre doğru ve iki adım açıksa kapı «Doğrulama
      kodu» adımına geçer; bilet yalnız bellekte durur (çereze, depoya
      yazılmaz). Altı hane yazılınca kendiliğinden gönderilir; «Yedek kod
      kullan» tek kullanımlık kodu alır. Kurulum hesap sayfasında: QR
      (qr.js), elle yazılacak anahtar, sonra kod. Yedek kodlar BİR KEZ
      gösterilir; sayfa kapanınca bellekten de silinir.
  18. KODLA BAĞLAN. Girişli cihaz Cihazlar › Yeni cihaz bağla'da altı haneli
      kod ve (ev ağı açıksa) tabletin kamerasıyla okunan QR gösterir; yeni
      cihaz kapıda «Kodla bağlan»la girer. Adres satırındaki ?bagla=…
      okunur ve hemen silinir: kod adres çubuğunda ve geçmişte kalmaz.
  19. ERİŞİM ANAHTARI BİR KEZ GÖRÜNÜR. Kısayollar ve otomasyon sayfası
      anahtarı yalnız açıldığı an gösterir (sunucu yalnız özetini tutar);
      tarifler o anahtarla doldurulur, sayfadan çıkınca bellekten gider.
  20. MODÜL KANCALARI SESSİZDİR. `gelen` (AYS, SPİ, ESP: Kısayollar'dan
      gelen satırı yalnız gönderildiği modül alır, kendi koduyla Onaylar'a
      öneri yapar) ve `yayin` (AYS, ESP: takvim aboneliği) başarılı bir
      eşitleme turundan sonra arkada koşar; hata
      modülü bekletmez, bir sonraki turda yeniden denenir. Yalnız bu
      cihazın alanı bu hesaba bağlıyken (söz 5) ve örnek profilde değilken
      koşar. Yayın, içeriği değişmedikçe yeniden gönderilmez.

   İKİNCİ TUR (2026-10-08: «hesap sistemini geliştir, özelliklerini ve
   tasarımını geliştir»; sunucu sözleri 18–19).
  21. CİHAZ AYRINTISI. Cihazlar'daki satır ayrıntıyı açar: kullanıcının
      verdiği ad (cihaza bağlı; çıkıp girse de kalır), nasıl girdiği, ilk
      giriş, son görülme ve eşitleme, son adres; oradan oturum kapatılır.
  22. YENİ GİRİŞ UYARISI. Başka bir cihazdan giriş, kodla bağlanma ya da
      yanlış deneme olunca hesap sayfasının başında «Bendim / İncele»
      kartı, kenardaki avatarda ve seçim sayfasının çipinde kırmızı nokta.
      Görülen, bu cihazın kapıya bakmayan çerezinde tutulur (her cihaz
      kendisi görür; aynı cihazdaki modüller birlikte); cihaz ilk kez
      bakıyorsa geçmiş görülmüş sayılır. Yoklama beş
      dakikada bir, eşitleme turunun ardından; hatası hiçbir şeyi bozmaz.

   ÜÇÜNCÜ TUR (2026-10-08: «hesap deposunun yedeği»; sunucu sözü 20).
  23. GERİ YÜKLEMEDEN SONRA VERİ CİHAZLARDAN AKAR. Sunucu her cevapta
      deponun dönemini söyler; dönem değiştiyse (bilgisayarda yedekten
      geri yüklendi) bu cihaz önce kendi kayıtlarını son eşitleme
      zamanıyla yollar — o adımda hiçbir şey inmez — sonra baştan
      indirir. Son yazan kazanır: yedekten sonraki değişiklik kaybolmaz.
      Yedekten sonra silinmiş bir kayıt geri gelebilir (silme izi
      cihazda tutulmaz); önizleme bunu söyler.
  24. YEDEKLER SAYFASI (admin): son yedek, «Şimdi yedekle», ikinci yer
      (başka disk ya da USB) ve yedek listesi. İkinci yer ve geri yükleme
      yalnız bilgisayarın kendisinden; geri yükleme büyük aksiyondur:
      önizleme (yedekte ve şimdi kaç kullanıcı, kaç kayıt), şifre, önce
      şimdiki hâlin yedeği. Sonra bu cihaz da çıkar, giriş ekranı gelir.
      Herkes Verin'de son yedeğin zamanını görür. Bilgisayarda bir yedek
      şifreyle DOSYA olarak indirilir (bulut, başka disk; ekran dosyanın ne
      taşıdığını söyler) ve dosyadan yüklenir: yüklenen yedek listeye girer,
      geri yükleme yine aynı onaydan geçer.
  25. SİRİ: «BUGÜN NE VAR?» (sunucu sözü 21). `yayin()` `bugun:{ metin, gun }`
      da döndürebilir: modülün KENDİ kuralıyla yazdığı bir iki cümle ve hangi
      günün olduğu. Gün değişince içerik aynı olsa da yeniden gider (imza
      günü de kapsar). Erişim anahtarı «özeti de okusun» seçilerek açılırsa
      Kısayollar `ozet.txt`'yi okur, Siri söyler. */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.HESAP = (function(){
  'use strict';

  const L = window.LIFEOS;
  const CEREZ = 'lifeos_hesap';
  const CIHAZ = 'lifeos_cihaz';
  const SUNUCU = 'lifeos_sunucu';
  const BETA = 'lifeos_beta';
  const HESAPLAR = 'lifeos_hesaplar';    // bu cihazda girilmiş hesaplar (söz 11)
  const HATIRLA_EN_COK = 4;
  const ONEK = 'lifeos.hesap.';
  const ARALIK = 60000;              // açıkken dakikada bir
  const ERTELE = 2500;               // yazmadan sonra toplu gönderim
  const ZAMAN_ASIMI = 60000;         // ilk eşitleme birkaç MB olabilir
  const DURUM_ZAMAN_ASIMI = 6000;
  const PARTI_KAYIT = 400;
  const PARTI_BAYT = 1500000;
  const TELEFON_KAPI = 5183;         // ev ağı https kapısı (sistem/telefon.py)
  const PC_KOK = 'http://127.0.0.1:4180';   // bilgisayarın kendisindeki seçim sayfası (sunucu.py)
  const EK_ARALIK = 30000;           // gelen kutusu ve yayın en çok yarım dakikada bir (söz 20)
  const BAG_YOKLA = 2500;            // kodla bağlamada «bağlandı mı?» yoklaması
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };
  /* Profil renkleri: kimlikler sunucudaki RENKLER ile aynı. Beyaz harf
     her birinde 4,5:1'in üstünde (küçük monogramda da okunur). */
  const RENK = { mavi:'#2D5BE3', turkuaz:'#0B7A69', turuncu:'#A85F12', mor:'#7453D4',
    pembe:'#C2457A', yesil:'#277A50', grafit:'#4A4F57' };
  const RENK_AD = { mavi:'Mavi', turkuaz:'Turkuaz', turuncu:'Turuncu', mor:'Mor', pembe:'Pembe',
    yesil:'Yeşil', grafit:'Grafit' };

  /* Dış dünya tek yerde; testler bunları değiştirir. */
  const ortam = {
    fetch:(a, b) => fetch(a, b),
    simdi:() => Date.now(),
    yerelUygulama:() => !!(typeof window !== 'undefined' && window.LIFEOS_YEREL),
    konum:() => window.location,
    cerez:{
      oku:() => (typeof document !== 'undefined' ? document.cookie : ''),
      yaz:s => { if(typeof document !== 'undefined') document.cookie = s; },
    },
    depo:{
      oku(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } },
      yaz(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
      sil(k){ try{ localStorage.removeItem(k); }catch(e){ /* depo yok */ } },
    },
    zamanla:(fn, ms) => setTimeout(fn, ms),
    iptal:id => clearTimeout(id),
    /* Hareket azaltılmış mı (animasyon.js matchMedia'yı LifeOS ayarına göre
       sarar; seçim sayfasında da yüklüdür). */
    azalt:() => { try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return true; } },
    /* Dosya ver: uygulamada paylaşım sayfası (indirme yok), tarayıcıda indirme. */
    indir:(ad, metin, tur) => {
      const blob = new Blob([metin], { type:tur || 'application/json' });
      try{
        if(window.LIFEOS_YEREL && navigator.canShare && typeof File === 'function'){
          const f = new File([blob], ad, { type:tur || 'application/json' });
          if(navigator.canShare({ files:[f] })) return navigator.share({ files:[f] });
        }
      }catch(e){ /* paylaşılamadı: indirmeye düş */ }
      const u = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = u; a.download = ad; a.hidden = true;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 5000);
    },
    rastgele:n => {
      const b = new Uint8Array(n);
      if(typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
      else for(let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
      return b;
    },
    /* Panoya: önce Clipboard API (localhost ve https güvenli bağlamdır),
       yoksa gizli alan + execCommand. Doner: kopyalandı mı. */
    kopyala:async metin => {
      try{
        if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(metin); return true; }
      }catch(e){ /* izin yok: eski yola düş */ }
      try{
        const t = document.createElement('textarea');
        t.value = metin; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        const ok = document.execCommand('copy');
        t.remove();
        return !!ok;
      }catch(e){ return false; }
    },
    /* ?bagla=… (söz 18): okunur ve adres çubuğundan hemen silinir. */
    sorguSil:ad => {
      try{
        const u = new URL(window.location.href);
        if(!u.searchParams.has(ad)) return;
        u.searchParams.delete(ad);
        window.history.replaceState(window.history.state, '', u.pathname + (u.search || '') + u.hash);
      }catch(e){ /* adres değiştirilemedi */ }
    },
  };

  let ayar = null;            // { modul, depo, yukle, yenile, mesgul, kesilebilir, ornek }
  let hal = { durum:'bilinmiyor', mesaj:'' };
  let sunucu = null;          // /api/hesap/durum cevabı; null = API yok/ulaşılamadı
  let erteleId = null, araId = null;
  let sonGorunur = 0, panelMesaj = '';
  let uyari = { liste:null, yeni:[] };   // söz 22: son güvenlik olayları ve görülmemişler
  /* Uzaktan gelenin modele (yukle) ve ekrana (yenile) inişi (söz 9). */
  let modelBekliyor = false, ekranBekliyor = false, yenileId = null, tazeleme = null;
  /* EŞİTLENDİ İŞARETİ (kullanıcı, 2026-10-05, «7 güzel»): bir şey gerçekten
     gidip geldiyse bulut simgesinde onay bir kez belirip söner. Boş tur
     (dakikalık yoklama) işaret koymaz. */
  const ONAY_MS = 1800;
  let onayBitis = 0;
  const dinleyiciler = [];

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* İki JSON değeri aynı mı? Anahtar sırası önemsiz (söz 10). */
  function esit(a, b){
    if(a === b) return true;
    if(a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if(Array.isArray(a) !== Array.isArray(b)) return false;
    if(Array.isArray(a)){
      if(a.length !== b.length) return false;
      for(let i = 0; i < a.length; i++) if(!esit(a[i], b[i])) return false;
      return true;
    }
    const ka = Object.keys(a);
    if(ka.length !== Object.keys(b).length) return false;
    return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && esit(a[k], b[k]));
  }

  /* --------------------------------------------------------- çerez */

  function cerezOku(ad){
    const m = String(ortam.cerez.oku() || '').match(new RegExp('(?:^|;\\s*)' + ad + '=([^;]*)'));
    if(!m || !m[1]) return null;
    try{ return JSON.parse(decodeURIComponent(m[1])); }catch(e){ return null; }
  }
  /* oturumluk: süresiz (tarayıcı/uygulama kapanınca biter) — beta girişi. */
  function cerezYaz(ad, deger, oturumluk){
    const guvenli = ortam.konum().protocol === 'https:' ? '; Secure' : '';
    ortam.cerez.yaz(ad + '=' + encodeURIComponent(JSON.stringify(deger))
      + '; Path=/' + (oturumluk ? '' : '; Max-Age=34560000') + '; SameSite=Strict' + guvenli);
  }
  function cerezSil(ad){ ortam.cerez.yaz(ad + '=; Path=/; Max-Age=0; SameSite=Strict'); }

  function cihazKimligi(){
    const c = cerezOku(CIHAZ);
    if(typeof c === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(c)) return c;
    const yeni = 'c' + Array.from(ortam.rastgele(12), x => x.toString(16).padStart(2, '0')).join('');
    cerezYaz(CIHAZ, yeni);
    return yeni;
  }
  function cihazAdi(){
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    const tur = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad'
      : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android telefon' : 'Android tablet')
      : /Windows/.test(ua) ? 'Windows PC' : /Macintosh/.test(ua) ? 'Mac' : 'Cihaz';
    return tur + (ortam.yerelUygulama() ? ' · uygulama' : '');
  }

  function oturum(){
    const o = cerezOku(CEREZ);
    return o && typeof o.j === 'string' && o.j && typeof o.a === 'string' ? o : null;
  }

  /* «192.168.0.10» → «https://192.168.0.10:5183». Yol, sorgu atılır. */
  function adresDuzelt(yazi){
    let s = String(yazi || '').trim();
    if(!s) return null;
    if(!/^https?:\/\//i.test(s)) s = 'https://' + s;
    let u;
    try{ u = new URL(s); }catch(e){ return null; }
    if(!u.hostname) return null;
    return u.protocol + '//' + u.hostname + ':' + (u.port || (u.protocol === 'https:' ? TELEFON_KAPI : 80));
  }

  /* Sunucu nerede? Uygulamada (telefon) kullanıcının yazdığı adres;
     tarayıcıda sayfanın kendi kökeni (LifeOS sunucusu her modül kapısında
     /api/hesap/ sunar). null = bilinmiyor. */
  function sunucuAdresi(){
    const o = oturum();
    if(o && typeof o.s === 'string' && o.s) return o.s;
    if(ortam.yerelUygulama()){
      const s = cerezOku(SUNUCU);
      return typeof s === 'string' && s ? s : null;
    }
    const k = ortam.konum();
    return /^https?:$/.test(k.protocol) ? '' : null;
  }

  /* ------------------------------------------------------- sıra */

  const anahtar = (tur, alan) => ONEK + tur + '.' + alan;
  function alan(){ return ayar && ayar.depo && ayar.depo.alan ? String(ayar.depo.alan) : ''; }
  function ornekMi(){ try{ return !!(ayar && ayar.ornek && ayar.ornek()); }catch(e){ return false; } }
  function siraOku(a){
    const s = ortam.depo.oku(anahtar('sira', a));
    return s && typeof s === 'object' && !Array.isArray(s) ? s : {};
  }
  function siraYaz(a, s){
    if(Object.keys(s).length) ortam.depo.yaz(anahtar('sira', a), s);
    else ortam.depo.sil(anahtar('sira', a));
  }
  function bekleyen(){ const a = alan(); return a ? Object.keys(siraOku(a)).length : 0; }
  function sahip(a){ const s = ortam.depo.oku(anahtar('sahip', a)); return typeof s === 'string' ? s : null; }
  const adEsit = (x, y) => String(x).toLocaleLowerCase('tr-TR') === String(y).toLocaleLowerCase('tr-TR');
  /* Bağı çözer (söz 13): bir sonraki girişte alan İLK EŞİTLEMEYLE bağlanır;
     cihazdaki kayıtlar yerinde kalır, hepsi yeni hesaba gider. */
  function baglantiCoz(a){
    ['sahip', 'imlec', 'hesap', 'sira', 'son'].forEach(t => ortam.depo.sil(anahtar(t, a)));
  }

  /* store.js her yazmada çağırır (onDegisim). */
  function degisti(yollar){
    if(!ayar || ornekMi()) return;
    const a = alan();
    if(!a || !sahip(a)) return;                       // söz 3
    const s = siraOku(a), z = ortam.simdi();
    (yollar || []).forEach(y => {
      if(typeof y === 'string' && y) s[y] = Math.max(z, (Number(s[y]) || 0) + 1);
    });
    siraYaz(a, s);
    durumYaz(hal.durum, hal.mesaj);
    ertele();
  }

  function ertele(ms){
    if(erteleId != null) ortam.iptal(erteleId);
    erteleId = ortam.zamanla(() => { erteleId = null; esitle(); }, ms == null ? ERTELE : ms);
  }

  /* ------------------------------------------------------- ağ */

  async function istek(base, yol, govde, jeton, sure){
    let kes = null, zaman = null;
    try{
      kes = new AbortController();
      zaman = ortam.zamanla(() => { try{ kes.abort(); }catch(e){ /* kapanmış */ } }, sure || DURUM_ZAMAN_ASIMI);
    }catch(e){ kes = null; }
    try{
      const baslik = {};
      if(govde){ baslik['Content-Type'] = 'application/json'; baslik['X-LifeOS'] = 'hesap'; }
      if(jeton) baslik.Authorization = 'Bearer ' + jeton;
      const r = await ortam.fetch(base + yol, {
        method:govde ? 'POST' : 'GET', headers:baslik,
        body:govde ? JSON.stringify(govde) : undefined,
        signal:kes ? kes.signal : undefined, cache:'no-store', credentials:'omit',
      });
      let v = null;
      try{ v = await r.json(); }catch(e){ v = null; }
      if(!r.ok){
        const h = new Error((v && v.hata) || ('Sunucu cevap vermedi (' + r.status + ').'));
        h.kod = r.status;
        throw h;
      }
      return v || {};
    }catch(e){
      if(e && e.kod) throw e;
      const h = new Error('Sunucuya ulaşılamadı.');
      h.kod = 0;
      throw h;
    }finally{
      if(zaman != null) ortam.iptal(zaman);
    }
  }

  async function yokla(){
    const base = sunucuAdresi();
    if(base === null){ sunucu = null; return null; }
    try{ sunucu = await istek(base, '/api/hesap/durum', null, null, DURUM_ZAMAN_ASIMI); }
    catch(e){ sunucu = null; }
    return sunucu;
  }

  /* ------------------------------------------------------- eşitleme */

  function partile(aday){
    const out = [];
    let bayt = 0;
    for(const g of aday){
      const n = JSON.stringify(g.d === undefined ? null : g.d).length + g.y.length + 40;
      if(out.length && (out.length >= PARTI_KAYIT || bayt + n > PARTI_BAYT)) break;
      out.push(g);
      bayt += n;
    }
    return out;
  }

  /* Aynı anda tek tur. Tur sürerken gelen çağrılar TEK bir sonraki tura
     bağlanır ve onu bekler: «eşitle» diyen, kendi değişikliğinin de
     gittiği turun bitişini görür. */
  let aktif = null, siradaki = null, profilTazelendi = false;
  function esitle(){
    if(siradaki) return siradaki;
    if(!aktif){
      aktif = tur().finally(() => { aktif = null; });
      return aktif;
    }
    siradaki = aktif.then(() => { siradaki = null; return esitle(); });
    return siradaki;
  }

  /* Söz 23: deponun dönemi ilk cevapta öğrenilir. Değiştiyse bilgisayarda
     yedekten geri yüklenmiştir: imleç başa döner, bu cihazın kayıtları
     yeniden gider (ilk eşitlemesi bitmemişse yine «ilk» olarak). */
  function donemDegisti(a, im, c){
    if(!c || typeof c.donem !== 'string' || !c.donem) return false;
    if(!im.donem){ im.donem = c.donem; return false; }
    if(im.donem === c.donem) return false;
    const yollar = Object.keys(ayar.depo.hepsi());
    ortam.depo.yaz(anahtar('imlec', a), !im.ilk
      ? { son:0, ilk:false, donem:c.donem, kalan:yollar }
      : { son:0, ilk:true, donem:c.donem, tazele:yollar, tz:Number(ortam.depo.oku(anahtar('son', a))) || 1 });
    return true;
  }

  async function tur(){
    if(!ayar || !ayar.depo) return hal;
    if(ornekMi()) return durumYaz('ornek', 'Örnek profil eşitlenmez.');
    let o = oturum();
    const base = sunucuAdresi(), a = alan();
    if(!o) return durumYaz(sunucu || ortam.yerelUygulama() ? 'giris' : 'yok', '');
    if(!o.h && !profilTazelendi && base !== null){
      profilTazelendi = true;                       // kimliksiz eski çerez: bir kez tazelenir
      try{ await ben(); }catch(e){ /* tur kendi hatasını görür */ }
      o = oturum() || o;
    }
    if(base === null) return durumYaz('adres', 'Bilgisayarın adresi bilinmiyor; yeniden giriş yap.');
    if(!a) return hal;
    let bagli = sahip(a);
    const hk = ortam.depo.oku(anahtar('hesap', a));
    if(bagli && o.h && typeof hk === 'string' && hk && hk !== o.h){
      /* Bağlı hesap silinmiş mi? (söz 13) Aynı ad + başka kimlik: evet. */
      let gitti = adEsit(bagli, o.a);
      if(!gitti){
        try{ gitti = (await istek(base, '/api/hesap/yasiyor', { kimlik:hk }, o.j, DURUM_ZAMAN_ASIMI)).var === false; }
        catch(e){ gitti = false; }
      }
      if(gitti){ baglantiCoz(a); bagli = null; }
    }
    if(bagli && !adEsit(bagli, o.a)){
      return durumYaz('baska', 'Bu cihazdaki ' + (MODUL_AD[ayar.modul] || '') + ' verisi «' + bagli
        + '» hesabına bağlı; «' + o.a + '» ile eşitlenmez.');
    }
    if(bagli && o.h && typeof hk !== 'string') ortam.depo.yaz(anahtar('hesap', a), o.h);   // eski bağa kimlik
    durumYaz('esitleniyor', '');
    let uygulanan = 0, giden = 0;
    try{
      let im = ortam.depo.oku(anahtar('imlec', a));
      if(!bagli || !im || typeof im !== 'object'){
        /* İlk bağlanış (söz 3): bütün yerel yollar «ilk» olarak gider. */
        im = { son:0, ilk:false, kalan:Object.keys(ayar.depo.hepsi()) };
        ortam.depo.yaz(anahtar('sahip', a), o.a);
        if(o.h) ortam.depo.yaz(anahtar('hesap', a), o.h);
        ortam.depo.yaz(anahtar('imlec', a), im);
      }
      for(let tur = 0; tur < 500; tur++){
        const hepsi = ayar.depo.hepsi();
        if(im.tazele){
          /* Söz 23, birinci adım: depo geri yüklendi; bu cihazın kayıtları
             son eşitleme zamanıyla gider (sunucuda son yazan kazanır). Bu
             adımda hiçbir şey inmez: sıradaki yol henüz gitmemiş kaydın
             üstüne eski sürümü yazmasın. Sıradaki değişiklik kendi
             zamanıyla ikinci adımda gider. */
          const s0 = siraOku(a);
          const kalan = im.tazele.filter(y => hepsi[y] !== undefined && s0[y] == null);
          const parti = partile(kalan.map(y => ({ y, d:hepsi[y], z:im.tz || 1 })));
          const c = await istek(base, '/api/hesap/esitle', { alan:a, cihaz:cihazKimligi(), cihaz_ad:cihazAdi(),
            son:0, gonder:parti, yalniz_gonder:true }, o.j, ZAMAN_ASIMI);
          giden += parti.length;
          if(donemDegisti(a, im, c)){ im = ortam.depo.oku(anahtar('imlec', a)); continue; }
          const gitti = new Set(parti.map(g => g.y));
          im.tazele = kalan.filter(y => !gitti.has(y));
          if(!im.tazele.length || !parti.length){ delete im.tazele; delete im.tz; }
          ortam.depo.yaz(anahtar('imlec', a), im);
          continue;
        }
        const aday = !im.ilk
          ? (im.kalan || []).filter(y => hepsi[y] !== undefined).map(y => ({ y, d:hepsi[y], z:1, ilk:true }))
          : Object.entries(siraOku(a)).map(([y, z]) => ({ y, d:hepsi[y] === undefined ? null : hepsi[y], z:Number(z) || 1 }));
        const parti = partile(aday);
        giden += parti.length;
        const c = await istek(base, '/api/hesap/esitle', { alan:a, cihaz:cihazKimligi(), cihaz_ad:cihazAdi(),
          son:im.son || 0, gonder:parti }, o.j, ZAMAN_ASIMI);
        if(donemDegisti(a, im, c)){ im = ortam.depo.oku(anahtar('imlec', a)); continue; }
        /* Uzaktan gelenler; sırada daha yeni değişikliği olan yol atlanır
           (söz 7), bu cihazdakiyle aynı olan yazılmaz (söz 10). */
        const sira = siraOku(a), yaz = [], yerel = (c.al || []).length ? ayar.depo.hepsi() : {};
        (c.al || []).forEach(r => {
          if(!r || typeof r.y !== 'string') return;
          if(sira[r.y] != null && Number(sira[r.y]) > Number(r.z)) return;
          const d = r.d === undefined ? null : r.d;
          if(esit(yerel[r.y] === undefined ? null : yerel[r.y], d)) return;
          yaz.push([r.y, d]);
        });
        if(yaz.length){ ayar.depo.uzaktan(yaz); uygulanan += yaz.length; }
        /* Gönderilen, gönderimden sonra yeniden değişmediyse sıradan düşer. */
        if(im.ilk){
          const s2 = siraOku(a);
          parti.forEach(g => { if(Number(s2[g.y]) === g.z) delete s2[g.y]; });
          siraYaz(a, s2);
        }else{
          const giden = new Set(parti.map(g => g.y));
          im.kalan = (im.kalan || []).filter(y => !giden.has(y) && hepsi[y] !== undefined);
          if(!im.kalan.length){ im.ilk = true; delete im.kalan; }
        }
        if(typeof c.son === 'number') im.son = c.son;
        ortam.depo.yaz(anahtar('imlec', a), im);
        const kalan = im.ilk ? Object.keys(siraOku(a)).length : im.kalan.length;
        if(!c.daha && (!kalan || !parti.length)) break;
      }
      ortam.depo.yaz(anahtar('son', a), ortam.simdi());
      if(giden || uygulanan){
        onayBitis = ortam.simdi() + ONAY_MS;
        ortam.zamanla(() => { onayBitis = 0; dugmeTazele(); }, ONAY_MS);
      }
      durumYaz('tamam', '');
      ekTur(o, base);                                  // söz 20: arkada, beklenmez
    }catch(e){
      if(e.kod === 401){
        cerezSil(CEREZ);
        durumYaz('giris', 'Oturum kapandı; yeniden giriş yap. Bu cihazdaki değişiklikler sırada bekliyor.');
      }else if(!e.kod){
        durumYaz('cevrimdisi', '');
      }else{
        durumYaz('hata', e.message);
      }
    }finally{
      if(uygulanan) yenileIste();
    }
    return hal;
  }

  /* ------------------------------------------------------- modül kancaları (söz 20)

     `gelen(oge)` → { durum:'onayda'|'anlasilmadi', sonuc } ya da null
     (null: satır bırakılır, sunucu sonra yeniden verir). `yayin()` →
     { takvim:{ metin, adet } }. İkisi de başarılı bir turdan sonra, en çok
     EK_ARALIK'ta bir, sırayla ve sessizce. */
  let ekAktif = false, sonGelen = 0, sonYayin = 0, sonUyari = 0, ekSon = null;
  function ekTur(o, base){
    if(ekAktif || !ayar || !o) return null;
    const simdi = ortam.simdi();
    const gelenVar = typeof ayar.gelen === 'function' && simdi - sonGelen >= EK_ARALIK;
    const yayinVar = typeof ayar.yayin === 'function' && simdi - sonYayin >= EK_ARALIK;
    const uyariVar = !sonUyari || simdi - sonUyari >= UYARI_ARALIK;
    if(!gelenVar && !yayinVar && !uyariVar) return null;
    ekAktif = true;
    return (ekSon = (async () => {
      try{
        if(uyariVar){ sonUyari = simdi; await uyarilar().catch(() => null); }
        if(gelenVar){ sonGelen = simdi; await gelenIsle(o, base); }
        if(yayinVar){ sonYayin = simdi; await yayinIsle(o, base); }
      }catch(e){ /* sessiz: bir sonraki turda yeniden */ }
      finally{ ekAktif = false; }
    })());
  }
  async function gelenIsle(o, base){
    const v = await istek(base, '/api/hesap/gelen-al', { modul:ayar.modul, cihaz:cihazKimligi(), cihaz_ad:cihazAdi() },
      o.j, DURUM_ZAMAN_ASIMI);
    for(const g of (Array.isArray(v.gelen) ? v.gelen : [])){
      let r = null;
      try{ r = await ayar.gelen(g); }catch(e){ console.error('Hesap: gelen satır', e); r = null; }
      if(!r || (r.durum !== 'onayda' && r.durum !== 'anlasilmadi')) continue;
      await istek(base, '/api/hesap/gelen-sonuc', { id:g.id, durum:r.durum, sonuc:String(r.sonuc || '').slice(0, 160),
        cihaz:cihazKimligi() }, o.j, DURUM_ZAMAN_ASIMI);
    }
  }
  /* İçerik imzası: takvim damgası (DTSTAMP, her üretimde değişir) sayılmaz. */
  function imza(metin){
    const s = String(metin).replace(/^DTSTAMP:.*$/gm, '');
    let h = 0x811c9dc5;
    for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return s.length + ':' + h.toString(16);
  }
  async function yayinIsle(o, base){
    const y = ayar.yayin() || {};
    for(const ad of Object.keys(y)){
      const x = y[ad];
      if(!x || typeof x.metin !== 'string') continue;
      const tam = ayar.modul + '/' + ad, k = anahtar('yayin', tam), kim = o.h || o.a;
      const gun = typeof x.gun === 'string' ? x.gun : null;
      const im = imza(x.metin) + (gun ? '@' + gun : ''), eski = ortam.depo.oku(k);
      if(eski && eski.imza === im && eski.h === kim) continue;
      await istek(base, '/api/hesap/yayin', { ad:tam, icerik:x.metin, adet:typeof x.adet === 'number' ? x.adet : null,
        gun }, o.j, ZAMAN_ASIMI);
      ortam.depo.yaz(k, { imza:im, h:kim });
    }
  }

  /* Uzaktan gelen kayıtlar uygulamanın belleğine (model) ancak yeniden
     yüklemeyle girer, ekrana ancak yeniden çizimle (söz 9).

     DOKUNULAN ALAN. Kullanıcının yazdığı (input/change olayı gelen) ve
     değeri çizildiği değerden (defaultValue) farklı olan görünür alan
     «kaydedilmemiş yazı»dır: yeniden çizim onu siler. Programın kendi
     koyduğu değer olay üretmez, sayılmaz. Kaydedince form yeniden
     çizilir, yeni alan temizdir. */
  const dokunulan = typeof WeakSet === 'function' ? new WeakSet() : null;
  function kirliMi(el){
    if(!dokunulan || !dokunulan.has(el) || el.disabled || el.readOnly) return false;
    if(el.tagName === 'SELECT'){
      const o = el.options;
      if(el.multiple || el.size > 1){
        for(let i = 0; i < o.length; i++) if(o[i].selected !== o[i].defaultSelected) return true;
        return false;
      }
      let v = -1;
      for(let i = 0; i < o.length; i++) if(o[i].defaultSelected) v = i;
      if(v < 0) for(let i = 0; i < o.length; i++) if(!o[i].disabled){ v = i; break; }
      return el.selectedIndex !== v;
    }
    const t = String(el.type || '').toLowerCase();
    if(t === 'checkbox' || t === 'radio') return el.checked !== el.defaultChecked;
    if(/^(hidden|button|submit|reset|image|file)$/.test(t)) return false;
    return el.value !== el.defaultValue;
  }
  /* Dinleyici dosya yüklenince kurulur, kur()'u beklemez: çizim isteyen
     öteki tazeleyiciler (cizIste) de aynı bilgiye bakar. */
  if(dokunulan && typeof document !== 'undefined' && document.addEventListener){
    const dokun = e => {
      const t = e.target;
      if(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) dokunulan.add(t);
    };
    document.addEventListener('input', dokun, true);
    document.addEventListener('change', dokun, true);
  }

  /* Neden beklenir? 'kagit': açık bir kağıt (ya da modülün kendi işi) —
     model de ekran da bekler, kağıdın elindeki kayıt tazelenen modelden
     kopmasın. 'yazi': kullanıcı yazıyor ya da yazıp henüz kaydetmedi —
     model hemen tazelenir, ekran bekler. null: beklenmez. */
  function mesgulNeden(){
    if(ayar && typeof ayar.mesgul === 'function'){
      try{ if(ayar.mesgul()) return 'kagit'; }catch(e){ /* sorulamadı */ }
    }
    if(typeof document === 'undefined') return null;
    /* Kesilebilir kağıt (kurulum sihirbazı): profil sunucudan gelince
       yenilenir ve sihirbaz kendiliğinden kapanır; beklemek, girişten sonra
       zaten dolu bir profilin boş formunu göstermek olurdu. */
    let kesilir = false;
    try{ kesilir = !!(ayar && typeof ayar.kesilebilir === 'function' && ayar.kesilebilir()); }catch(e){ kesilir = false; }
    const k = document.querySelector('#sheet .sheet');
    if(k && k.getClientRects().length && !kesilir) return 'kagit';
    const sayilir = el => !(el.closest && (el.closest('[data-hesap-panel]') || (kesilir && el.closest('#sheet'))));
    const a = document.activeElement;
    if(a && a !== document.body && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) && sayilir(a)) return 'yazi';
    const alanlar = document.querySelectorAll('input, textarea, select');
    for(let i = 0; i < alanlar.length; i++){
      const el = alanlar[i];
      if(kirliMi(el) && sayilir(el) && el.getClientRects().length) return 'yazi';
    }
    return null;
  }
  function yenileIste(){
    if(!ayar) return;
    if(typeof ayar.yukle === 'function') modelBekliyor = true;
    if(typeof ayar.yenile === 'function') ekranBekliyor = true;
    yenileDene();
  }
  function yenileDene(){
    if(yenileId != null){ ortam.iptal(yenileId); yenileId = null; }
    const o = ayar;
    if(!o) return;
    const neden = mesgulNeden();
    if(modelBekliyor && neden !== 'kagit'){
      modelBekliyor = false;
      tazeleme = Promise.resolve(tazeleme).then(() => o.yukle())
        .catch(e => console.error('Hesap: model tazelenemedi', e));
    }
    if(ekranBekliyor && !modelBekliyor && !neden){
      ekranBekliyor = false;
      Promise.resolve(tazeleme).then(() => o.yenile())
        .catch(e => console.error('Hesap: yeniden yükleme', e));
    }
    if(modelBekliyor || ekranBekliyor) yenileId = ortam.zamanla(() => { yenileId = null; yenileDene(); }, 1500);
  }

  /* ÖTEKİ TAZELEYİCİLER DE YAZILANI SİLMEZ (söz 9). King'in teklifleri ve
     haftalık özet gibi arka plan yoklamaları da ekranı baştan çizer:
     veriyi hemen koyar, çizimi buradan ister. Kullanıcı yazmıyorsa hemen
     çizilir; yazıyorsa, yazıp kaydetmediyse ya da kağıt açıksa 1,5 sn'de
     bir yeniden bakılır. Aynı çizim üst üste istenirse bir kez yapılır.
     Denetim eşitlemeninkidir (mesgulNeden); ikinci bir «yazıyor mu?» yok. */
  const cizimler = [];
  let cizimId = null;
  function cizIste(fn){
    if(typeof fn !== 'function') return;
    if(cizimler.indexOf(fn) < 0) cizimler.push(fn);
    cizimDene();
  }
  function cizimDene(){
    if(cizimId != null){ ortam.iptal(cizimId); cizimId = null; }
    if(!cizimler.length) return;
    if(mesgulNeden()){ cizimId = ortam.zamanla(() => { cizimId = null; cizimDene(); }, 1500); return; }
    cizimler.splice(0).forEach(fn => {
      try{ Promise.resolve(fn()).catch(e => console.error('Hesap: çizim', e)); }
      catch(e){ console.error('Hesap: çizim', e); }
    });
  }

  /* ------------------------------------------------------- hesap işleri */

  /* Çerezdeki profil: g görünen ad, k renk, p plan, pa planın adı. Hesap
     düğmesi, kısa panel ve seçim sayfasının çipi sunucuyu beklemeden
     bunu çizer. */
  function profilAlanlari(k, eski){
    eski = eski || {};
    const dg = /^\d{4}-\d{2}-\d{2}$/.test(k.dogum || '') ? k.dogum.slice(5) : '';
    return { a:k.ad, r:k.rol, g:k.gorunen_ad || k.ad, k:RENK[k.renk] ? k.renk : 'mavi',
      p:k.plan || 'ucretsiz', pa:k.plan_ad || '',
      /* kimlik (söz 13), hitap ve doğum günü (AA-GG; King'in selamı, söz 14).
         Alan cevapta yoksa (başkasının satırı) eldeki kalır. */
      h:typeof k.kimlik === 'string' ? k.kimlik : (eski.h || ''),
      t:typeof k.hitap === 'string' ? k.hitap : (eski.t || ''),
      dg:typeof k.dogum === 'string' ? dg : (eski.dg || '') };
  }
  function oturumYaz(v, base){
    if(!v || !v.jeton || !v.kullanici) throw new Error('Sunucunun cevabı okunamadı.');
    cerezYaz(CEREZ, Object.assign({ j:v.jeton, s:base || '' }, profilAlanlari(v.kullanici)));
    if(ortam.yerelUygulama() && base) cerezYaz(SUNUCU, base);
    hatirla(v.kullanici);
    kapiKapat();
    cipTazele();
  }
  /* Sunucudaki profil (başka cihazda değişmiş olabilir) çereze iner. */
  function profilYaz(k){
    const o = oturum();
    if(!o || !k || typeof k.ad !== 'string') return;
    if(k.ad.toLocaleLowerCase('tr-TR') !== o.a.toLocaleLowerCase('tr-TR')) return;
    const y = profilAlanlari(k, o);
    if(['a', 'r', 'g', 'k', 'p', 'pa', 'h', 't', 'dg'].some(x => y[x] !== o[x])) cerezYaz(CEREZ, Object.assign({}, o, y));
    hatirla(k);
    dugmeTazele();
    cipTazele();
  }

  /* BU CİHAZDAKİ HESAPLAR (söz 11): karşılamada tek dokunuşla seçilir. */
  function hatirlananlar(){
    const l = cerezOku(HESAPLAR);
    return Array.isArray(l) ? l.filter(x => x && typeof x.a === 'string' && x.a).slice(0, HATIRLA_EN_COK) : [];
  }
  function hatirla(k){
    if(!k || typeof k.ad !== 'string' || !k.ad) return;
    const ad = k.ad.toLocaleLowerCase('tr-TR');
    const l = hatirlananlar().filter(x => x.a.toLocaleLowerCase('tr-TR') !== ad);
    l.unshift({ a:k.ad, g:k.gorunen_ad || k.ad, k:RENK[k.renk] ? k.renk : 'mavi' });
    cerezYaz(HESAPLAR, l.slice(0, HATIRLA_EN_COK));
  }
  function unut(ad){
    const l = hatirlananlar().filter(x => x.a !== ad);
    if(l.length) cerezYaz(HESAPLAR, l); else cerezSil(HESAPLAR);
  }

  function hedefAdres(adres){
    if(adres != null && String(adres).trim()){
      const d = adresDuzelt(adres);
      if(!d) throw new Error('Bilgisayarın adresi okunamadı (örnek: 192.168.0.10).');
      return d;
    }
    const b = sunucuAdresi();
    if(b === null) throw new Error('Bilgisayarın adresini yaz (örnek: 192.168.0.10).');
    return b;
  }

  /* İki adım açıksa (söz 17) oturum açılmaz: { iki_adim:true, bilet } döner,
     kapı kod adımına geçer. Bilet yalnız bellekte (kapı) durur. */
  async function girisYap(ad, parola, adres){
    const base = hedefAdres(adres);
    const v = await istek(base, '/api/hesap/giris', { ad, parola, cihaz:cihazKimligi(), cihaz_ad:cihazAdi() }, null, 30000);
    if(v && v.iki_adim) return { iki_adim:true, bilet:v.bilet, adres:base };
    oturumYaz(v, base);
    sunucu = sunucu || { kurulum:false };
    esitle();
    return v.kullanici;
  }
  async function girisKod(bilet, kod, adres){
    const base = adres || hedefAdres(null);
    const v = await istek(base, '/api/hesap/giris-kod', { bilet, kod }, null, 30000);
    oturumYaz(v, base);
    sunucu = sunucu || { kurulum:false };
    esitle();
    return v.kullanici;
  }
  /* Kodla bağlan (söz 18): girişli cihazın açtığı altı haneli kod. */
  async function baglaKod(kod, adres){
    const base = hedefAdres(adres);
    const v = await istek(base, '/api/hesap/bagla', { kod:String(kod || '').replace(/\D/g, ''),
      cihaz:cihazKimligi(), cihaz_ad:cihazAdi() }, null, 30000);
    oturumYaz(v, base);
    sunucu = sunucu || { kurulum:false };
    esitle();
    return v.kullanici;
  }

  /* Kendi kendine hesap: ad, şifre ve kullanıcının KENDİ yazdığı kurtarma
     sorusuyla cevabı. İlk hesap yalnız bilgisayarın kendisinde açılır ve
     admin olur (sunucu sözü 5). */
  async function kayitOl(ad, sifre, soru, cevap, adres){
    const base = hedefAdres(adres);
    const v = await istek(base, '/api/hesap/kayit', { ad, parola:sifre, soru, cevap,
      cihaz:cihazKimligi(), cihaz_ad:cihazAdi() }, null, 30000);
    oturumYaz(v, base);
    sunucu = Object.assign({}, sunucu, { kurulum:false });
    esitle();
    return v.kullanici;
  }

  /* Şifremi unuttum: önce kullanıcının kendi sorusu, sonra cevapla yeni
     şifre (sunucu sözü 7). Doğru cevap oturumu da açar. */
  async function soruGetir(ad, adres){
    const v = await istek(hedefAdres(adres), '/api/hesap/soru', { ad }, null, 15000);
    return v.soru;
  }
  async function kurtar(ad, cevap, yeni, adres){
    const base = hedefAdres(adres);
    const v = await istek(base, '/api/hesap/kurtar', { ad, cevap, yeni,
      cihaz:cihazKimligi(), cihaz_ad:cihazAdi() }, null, 30000);
    if(v && v.iki_adim) return { iki_adim:true, bilet:v.bilet, adres:base };   // yeni şifre kodla yazılır
    oturumYaz(v, base);
    esitle();
    return v.kullanici;
  }

  async function cikisYap(){
    const o = oturum(), base = sunucuAdresi();
    cerezSil(CEREZ);
    if(o && base !== null){
      try{ await istek(base, '/api/hesap/cikis', {}, o.j, 6000); }catch(e){ /* jeton zaten silindi */ }
    }
    durumYaz('giris', '');
  }

  async function parolaDegistir(eski, yeni){
    const o = oturum(), base = sunucuAdresi();
    if(!o || base === null) throw new Error('Önce giriş yap.');
    return istek(base, '/api/hesap/parola', { eski, yeni }, o.j, 30000);
  }

  async function soruAyarla(sifre, soru, cevap){
    const o = oturum(), base = sunucuAdresi();
    if(!o || base === null) throw new Error('Önce giriş yap.');
    return istek(base, '/api/hesap/soru-ayarla', { parola:sifre, soru, cevap }, o.j, 30000);
  }

  /* BETA GİRİŞİ (depo sahibi, 2026-10-04: «şimdilik beta girişi diye bir
     buton olsun ama istersek kullanıcı şeklinde de girebilelim»): hesapsız,
     kayıtlar yalnız bu cihazda. Oturumluk çerez: uygulama kapanınca giriş
     ekranı yine gelir. Sonra kaldırılacak. */
  function betaMi(){ return cerezOku(BETA) === 1; }
  function betaGir(){
    cerezYaz(BETA, 1, true);
    kapiKapat();
    durumYaz(hal.durum, hal.mesaj);
  }

  /* ------------------------------------------------------- durum */

  function saatMetni(ms){
    if(!ms) return '';
    const d = new Date(ms);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function durumMetni(){
    const n = bekleyen(), sira = n ? n + ' değişiklik sırada' : '';
    switch(hal.durum){
      case 'tamam': {
        const s = saatMetni(ortam.depo.oku(anahtar('son', alan())));
        return 'Eşitlendi' + (s ? ' · ' + s : '') + (n ? ' · ' + sira : '');
      }
      case 'esitleniyor': return 'Eşitleniyor…';
      case 'cevrimdisi': return 'Bilgisayara ulaşılamıyor' + (n ? ' · ' + sira + '; bağlanınca gider' : ' · bağlanınca eşitlenir');
      case 'giris': return hal.mesaj || ('Giriş yapılmadı' + (n ? ' · ' + sira : ''));
      case 'adres': case 'baska': case 'hata': case 'ornek': return hal.mesaj;
      case 'yok': return 'Bu sayfa LifeOS sunucusundan açılmadı; hesap kullanılamıyor.';
      default: return '';
    }
  }

  function gizliMi(){
    if(ortam.yerelUygulama() || oturum() || bekleyen()) return false;
    return hal.durum === 'yok' || hal.durum === 'bilinmiyor';
  }

  /* Kenarın «ben» satırında profil adının altındaki kısa durum (kabuk.js
     kenarAraclari; kullanıcı, 2026-10-06: «burayı da düzenle, daha sade»).
     Hesap ayrı satır değil: tek bakışta «Eşitlendi · 14:20». */
  function kisaDurum(){
    if(gizliMi()) return '';
    if(!oturum() && betaMi()) return 'Beta · yalnız bu cihazda';
    const n = bekleyen(), sira = n ? ' · ' + n + ' sırada' : '';
    switch(hal.durum){
      case 'tamam': {
        const s = saatMetni(ortam.depo.oku(anahtar('son', alan())));
        return 'Eşitlendi' + (s ? ' · ' + s : '') + sira;
      }
      case 'esitleniyor': return 'Eşitleniyor…';
      case 'cevrimdisi': return 'Çevrimdışı' + sira;
      case 'giris': return 'Giriş yapılmadı';
      case 'ornek': return 'Örnek profil';
      case 'yok': case 'bilinmiyor': return '';
      default: return 'Eşitleme durdu';
    }
  }

  /* kabuk.js düğmeyi çizerken sorar. */
  function dugme(){
    const o = oturum();
    const sinif = ' is-' + (hal.durum === 'tamam' && bekleyen() ? 'bekliyor' : hal.durum)
      + (onayBitis > ortam.simdi() ? ' is-esitlendi' : '');
    const metin = durumMetni();
    return {
      sinif, gizli:gizliMi(), kisa:kisaDurum(), hal:hal.durum,
      etiket:'Hesap ve eşitleme' + (o ? ' — ' + o.a : '') + (metin ? ': ' + metin : ''),
      ipucu:o ? o.a + (metin ? ' · ' + metin : '') : 'Hesap: giriş yapılmadı',
    };
  }

  function durum(){
    const o = oturum();
    return { durum:hal.durum, mesaj:hal.mesaj, metin:durumMetni(), bekleyen:bekleyen(),
      oturum:o ? { ad:o.a, rol:o.r, sunucu:o.s || '', gorunen_ad:o.g || o.a, renk:o.k || 'mavi',
        plan:o.p || 'ucretsiz', hitap:o.t || '', dogum_gun:o.dg || '' } : null, sunucu };
  }

  /* «Bütün veriyi sil» kapısının notu: bağlı alanda silme sunucuya ve
     öteki cihazlara da gider (store.js clear → degisti). */
  function silmeNotu(){
    const o = oturum(), a = alan();
    if(!o || !a || !sahip(a)) return null;
    return 'Bu cihaz «' + o.a + '» hesabına bağlı: silme bilgisayardaki kopyaya ve öteki cihazlara da gider.';
  }

  function dinle(fn){
    dinleyiciler.push(fn);
    return () => { const i = dinleyiciler.indexOf(fn); if(i >= 0) dinleyiciler.splice(i, 1); };
  }

  function durumYaz(d, mesaj){
    hal = { durum:d, mesaj:mesaj || '' };
    dugmeTazele();
    cipTazele();
    const el = typeof document !== 'undefined' && document.getElementById('hesap-durum');
    if(el){
      el.textContent = durumMetni();
      el.className = 'hesap__durum is-' + hal.durum;
    }
    const kisa = typeof document !== 'undefined' && document.getElementById('hesap-esit-kisa');
    if(kisa) kisa.textContent = esitKisa();
    dinleyiciler.slice().forEach(fn => { try{ fn(durum()); }catch(e){ console.error('Hesap dinleyicisi:', e); } });
    return hal;
  }

  function dugmeTazele(){
    if(typeof document === 'undefined') return;
    const d = dugme();
    document.querySelectorAll('.ust__hesap').forEach(b => {
      b.className = b.className.replace(/\s?is-[a-z]+/g, '') + d.sinif;
      b.hidden = d.gizli;
      b.setAttribute('aria-label', d.etiket);
      b.setAttribute('title', d.ipucu);
    });
    document.querySelectorAll('[data-hesap-ben]').forEach(b => {
      b.setAttribute('data-hal', d.gizli ? 'yok' : d.hal);
      /* Söz 22: başka cihazdan yeni giriş ya da yanlış deneme — avatarda kırmızı nokta. */
      if(uyari.yeni.length && oturum()) b.setAttribute('data-uyari', String(uyari.yeni.length));
      else b.removeAttribute('data-uyari');
      const s = b.querySelector('[data-hesap-durum]');
      if(s){ if(s.textContent !== d.kisa) s.textContent = d.kisa; s.hidden = !d.kisa; }
    });
  }

  /* ------------------------------------------------------- ortak parçalar */

  function alanHtml(id, etiket, tur, ek){
    return '<label class="hesap__alan" for="' + id + '"><span>' + kac(etiket) + '</span>'
      + '<input id="' + id + '" type="' + (tur || 'text') + '" ' + (ek || '') + '/></label>';
  }
  const AD_EK = 'autocapitalize="none" autocorrect="off" spellcheck="false" required minlength="2" maxlength="32"';
  const CEVAP_EK = 'required minlength="2" maxlength="120" autocomplete="off" autocapitalize="none" spellcheck="false"';

  /* Çizgi simgeler (tek renk, metnin renginde; sade görsel kararı). */
  const IKON = {
    profil:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>',
    plan:'<path d="M12 3.8l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.2l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
    cihazlar:'<rect x="3" y="5" width="13" height="10" rx="1.8"/><path d="M7 19h5"/><rect x="17.5" y="9" width="4" height="10" rx="1.2"/>',
    guvenlik:'<rect x="5" y="10.5" width="14" height="9.5" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    anahtar:'<circle cx="8" cy="15" r="3.5"/><path d="M10.6 12.4 19 4M15.5 7.5l2.5 2.5"/>',
    soru:'<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.6a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.5"/><path d="M12 16.9v.1"/>',
    esitleme:'<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z"/>',
    yonetim:'<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.9-2.8 2.9-4.3 5.5-4.3s4.6 1.5 5.5 4.3"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.8c2.2 0 3.8 1.3 4.5 3.7"/>',
    ekle:'<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    telefon:'<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.5h2"/>',
    tablet:'<rect x="4.5" y="3" width="15" height="18" rx="2.2"/><path d="M11 18h2"/>',
    bilgisayar:'<rect x="3" y="4.5" width="18" height="12" rx="1.8"/><path d="M8.5 20h7M12 16.5V20"/>',
    ileri:'<path d="M9.5 6l6 6-6 6"/>',
    geri:'<path d="M14.5 6l-6 6 6 6"/>',
    kapat:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    tamam:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    goz:'<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    etkinlik:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    veri:'<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6"/><path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
    indir:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
    uyari:'<path d="M12 4.5 20.5 19H3.5z"/><path d="M12 10v4M12 16.6v.2"/>',
    giris:'<path d="M10 4.5h7.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10"/><path d="M3.5 12H14M10.5 8.5 14 12l-3.5 3.5"/>',
    cikis:'<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M10.5 12H20M16.5 8.5 20 12l-3.5 3.5"/>',
    kalkan:'<path d="M12 3.5 5 6.2v5.3c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6.2z"/><path d="M9 12.2l2.2 2.2 3.8-4.2"/>',
    takvim:'<rect x="4" y="5.5" width="16" height="14.5" rx="2.4"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    kisayol:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M13 7.5 9.5 12.5H14L10.5 17"/>',
    gelen:'<path d="M4 13.5 6.4 6.6a1.6 1.6 0 0 1 1.5-1.1h8.2a1.6 1.6 0 0 1 1.5 1.1L20 13.5v4.4a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.9z"/><path d="M4 13.5h4.5l1.2 2h4.6l1.2-2H20"/>',
    baglanti:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    kalp:'<path d="M12 19.5s-7.5-4.4-7.5-9.6A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3c0 5.2-7.5 9.6-7.5 9.6z"/>',
    ev:'<path d="M4.5 11 12 4.5l7.5 6.5"/><path d="M6.5 9.5v10h11v-10"/><path d="M10 19.5v-5h4v5"/>',
    kopyala:'<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5V6.2a1.7 1.7 0 0 0-1.7-1.7H6.2a1.7 1.7 0 0 0-1.7 1.7v7.6a1.7 1.7 0 0 0 1.7 1.7h2.3"/>',
    yenile:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4.2h-4.2"/>',
    yedek:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4.2h4.2"/><path d="M12 8.2v4l2.8 1.8"/>',
    disk:'<rect x="3.5" y="13" width="17" height="6.5" rx="1.8"/><path d="M5.5 13l2-7.5h9l2 7.5"/><path d="M16.5 16.2v.1"/>',
    qr:'<rect x="4" y="4" width="6" height="6" rx="1.2"/><rect x="14" y="4" width="6" height="6" rx="1.2"/><rect x="4" y="14" width="6" height="6" rx="1.2"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19.5h1M19.5 14v1"/>',
  };
  function ikon(ad, sinif){
    return '<svg class="' + (sinif || 'hesap-ikon') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IKON[ad] || '') + '</svg>';
  }

  /* Monogram: görünen adın baş harfi, profil renginde. */
  function harfi(s){ return (String(s || '').trim().charAt(0) || '·').toLocaleUpperCase('tr-TR'); }
  function avatar(ad, renk, boyut){
    return '<span class="hesap-avatar" style="--av:' + (RENK[renk] || RENK.mavi) + ';--av-boyut:' + (boyut || 40) + 'px" aria-hidden="true">'
      + kac(harfi(ad)) + '</span>';
  }

  /* Şifre alanı: göster/gizle, büyük harf kilidi uyarısı ve (yeni
     şifrede) güç çubuğu. Güç yalnız ipucudur; sunucu uzunluğa bakar. */
  function sifreAlani(id, etiket, ac, guc){
    return '<label class="hesap__alan" for="' + id + '"><span>' + kac(etiket) + '</span>'
      + '<span class="hesap__sifre"><input id="' + id + '" type="password" autocomplete="' + ac + '" required'
      + (ac === 'new-password' ? ' minlength="8"' : '') + ' data-sifre/>'
      + '<button type="button" class="hesap__goster" data-hesap="goster" aria-label="Şifreyi göster" aria-pressed="false">'
      + ikon('goz') + '</button></span>'
      + (guc ? '<span class="hesap__guc" data-guc="0" hidden><i></i><i></i><i></i><small></small></span>' : '')
      + '</label>';
  }
  const CAPS = '<p class="hesap__caps" hidden>Büyük harf kilidi açık</p>';
  const GUC_AD = ['En az 8 karakter', 'Zayıf', 'İyi', 'Güçlü'];
  function sifreGucu(s){
    s = String(s || '');
    if(s.length < 8) return 0;
    const tur = [/[a-zçğıöşü]/, /[A-ZÇĞİÖŞÜ]/, /[0-9]/, /[^0-9A-Za-zÇĞİÖŞÜçğıöşü]/].filter(r => r.test(s)).length;
    if(s.length >= 16 || (s.length >= 12 && tur >= 3)) return 3;
    if(s.length >= 12 || tur >= 3) return 2;
    return 1;
  }
  function gucTazele(input){
    const lab = input.closest && input.closest('.hesap__alan');
    const g = lab && lab.querySelector('.hesap__guc');
    if(!g) return;
    const p = sifreGucu(input.value);
    g.hidden = !input.value;
    g.setAttribute('data-guc', String(p));
    g.querySelector('small').textContent = GUC_AD[p];
  }

  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function tarihMetni(s){
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    return m ? Number(m[3]) + ' ' + AYLAR[Number(m[2]) - 1] + ' ' + m[1] : '';
  }
  function sonMetni(ms){
    if(!ms) return 'hiç';
    const d = new Date(ms), b = new Date(ortam.simdi());
    const gun = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const fark = Math.round((gun(b) - gun(d)) / 86400000);
    if(fark <= 0) return 'bugün ' + saatMetni(ms);
    if(fark === 1) return 'dün ' + saatMetni(ms);
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + (d.getFullYear() !== b.getFullYear() ? ' ' + d.getFullYear() : '');
  }
  /* «4:32 kaldı» — bağlama kodunun süresi. */
  function kalanMetni(bitis){
    const s = Math.max(0, Math.ceil((Number(bitis) - ortam.simdi()) / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' kaldı';
  }
  function cihazTuru(ad){
    const s = String(ad || '');
    return /iPhone|telefon/i.test(s) ? 'telefon' : /iPad|tablet/i.test(s) ? 'tablet' : 'bilgisayar';
  }
  const ROL_AD = r => (r === 'admin' ? 'Admin' : 'Üye');

  /* Bilgisayarın kendisinde: telefon ve tablette yazılacak adres. Ev ağı
     kapalıysa (sertifika yok) nasıl açılacağı söylenir. */
  function adresNotu(){
    if(ortam.yerelUygulama() || !sunucu || !sunucu.yerel) return '';
    const l = Array.isArray(sunucu.ev_agi) ? sunucu.ev_agi : [];
    if(l.length){
      return '<p class="hesap__not">Telefonda ve tablette bilgisayarın adresi: <b>' + l.map(kac).join('</b> ya da <b>')
        + '</b>. Tablette tarayıcıda <b>https://' + kac(l[0]) + ':' + TELEFON_KAPI + '</b> açılır.</p>';
    }
    return '<p class="hesap__not">Telefon ve tablet için ev ağı kapalı. Bilgisayarda bir kez '
      + '<code>python sistem/telefon.py</code> çalıştırıp LifeOS\'u yeniden başlat.</p>';
  }

  function adresAlani(){
    if(!ortam.yerelUygulama()) return '';
    const adres = cerezOku(SUNUCU) || '';
    return alanHtml('hesap-adres', 'Bilgisayarın adresi', 'text',
      'inputmode="url" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="192.168.0.10" value="'
      + kac(String(adres).replace(/^https:\/\//, '').replace(':' + TELEFON_KAPI, '')) + '"');
  }

  function baglantiHatasi(){
    return ortam.yerelUygulama()
      ? 'Bilgisayara ulaşılamadı. Aynı Wi-Fi\'da mısınız, LifeOS açık mı, adres doğru mu? '
        + 'iPhone\'da LifeOS kök sertifikası kurulu ve «tam güven» açık olmalı.'
      : 'Bilgisayara ulaşılamadı; LifeOS açık mı?';
  }

  function mesajYaz(m){
    const el = typeof document !== 'undefined' && document.getElementById('hesap-mesaj');
    if(!el) return;
    el.textContent = m || '';
    el.hidden = !m;
  }

  /* ------------------------------------------------------- giriş ekranı

     Açılışta hesap yoksa (ve beta girişi seçilmediyse) uygulamanın önünde
     tek sade kart. ÖNCE ANA MENÜ (söz 11): bu cihazdaki hesaplar, «Giriş
     yap», «Hesap oluştur», beta girişi; form seçilince yandan kayarak
     gelir, «‹» ana menüye döner. Sunucu yoksa (geliştirme sunucusu,
     dosyadan açılmış sayfa) hiç çıkmaz; telefon uygulamasında
     bilgisayarın adresini de sorar. Hata olunca kart yeniden çizilmez:
     yazılan kaybolmaz, yalnız mesaj. */
  const KAPI_SIRA = { karsila:0, giris:1, kayit:1, bagla:1, unuttum:2, kod:3 };
  const KAPI_BOS = () => ({ gorunum:'karsila', soru:null, ad:'', adres:null, secili:null, ilk:true,
    bilet:null, yedekKip:false, kod:'' });
  let kapi = KAPI_BOS();

  function kapiGerekli(){
    if(oturum() || betaMi() || ornekMi()) return false;
    return !!sunucu || ortam.yerelUygulama();
  }

  function kurulumMu(){ return !!(sunucu && sunucu.kurulum); }
  /* Hesap oluşturulabilir mi? Sunucu henüz bilinmiyorsa (uygulama, adres
     yazılmadı) evet: kararı sunucu verir. */
  function kayitAcikMi(){
    if(!sunucu) return true;
    if(sunucu.kurulum) return !!sunucu.yerel;
    return sunucu.kayit !== false;
  }

  function kapiNotu(){
    if(!sunucu){
      return ortam.yerelUygulama()
        ? 'Telefon ve bilgisayar aynı Wi-Fi\'da olmalı. Adres, bilgisayardaki LifeOS\'ta Hesap › Cihazlar\'da yazar.'
        : 'Bilgisayara ulaşılamıyor. Beta girişiyle bu cihazda devam edebilirsin.';
    }
    if(sunucu.kurulum) return sunucu.yerel ? 'İlk hesap admin olur.' : 'İlk hesap bilgisayarın kendisinde açılır.';
    return '';
  }

  /* LifeOS işareti: dört sistemin rengi. Her şekil kendi grubunda; ilk
     açılışta sırayla belirir (grup oynar, şeklin kendi dönüşü bozulmaz). */
  function isaret(ilk){
    return '<svg class="hesap-kapi__isaret' + (ilk ? ' is-ilk' : '') + '" viewBox="0 0 32 32" aria-hidden="true">'
      + '<g><rect x="3" y="3" width="12" height="12" rx="3" fill="#4F86FF"/></g>'
      + '<g><circle cx="23" cy="9" r="6" fill="#2EC4A9"/></g>'
      + '<g><rect x="5" y="19" width="9" height="9" rx="2" fill="#F2A93B" transform="rotate(45 9.5 23.5)"/></g>'
      + '<g><rect x="17" y="17" width="12" height="12" rx="3" fill="#9A86FF"/></g></svg>';
  }

  /* ANA SAYFA (depo sahibi, 2026-10-05: «giriş kısmına bir anasayfa;
     güzel bir giriş»). Kartın yanında (telefonda üstünde) tek ekranlık
     tanıtım: işaret, tek cümle, dört sistem, üç söz. Kaydırma yok;
     telefonda form açılınca tanıtım çekilir, form tek işe kalır. */
  const SISTEMLER = [
    ['AYS', 'Sınav hazırlığı', '<rect x="5" y="5" width="14" height="14" rx="3.5"/>', '#4F86FF'],
    ['SPİ', 'Sağlık ve toparlanma', '<circle cx="12" cy="12" r="7.5"/>', '#2EC4A9'],
    ['ESP', 'Dil, müzik, okuma', '<rect x="6.6" y="6.6" width="10.8" height="10.8" rx="2.4" transform="rotate(45 12 12)"/>', '#F2A93B'],
    ['Merkez', 'Günün özeti', '<path d="M12 4.3 18.8 8.2v7.6L12 19.7 5.2 15.8V8.2z"/>', '#9A86FF'],
  ];
  const SOZLER = ['PC, telefon ve tablet aynı hesapla', 'Verin hiçbir şirketin sunucusuna gitmez',
    'Bilgisayar kapalıyken de çalışır'];
  function tanitimHtml(){
    return '<section class="hesap-kapi__tanitim" aria-label="LifeOS">' + isaret(true)
      + '<p class="hesap-kapi__ad">LifeOS</p>'
      + '<p class="hesap-kapi__slogan">Sınav, sağlık ve gelişim tek yerde.</p>'
      + '<ul class="hesap-kapi__sistemler">' + SISTEMLER.map(([ad, acik, sekil, renk], i) =>
          '<li style="--renk:' + renk + ';--sira:' + i + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + sekil + '</svg>'
          + '<b>' + kac(ad) + '</b><span>' + kac(acik) + '</span></li>').join('') + '</ul>'
      + '<ul class="hesap-kapi__sozler">' + SOZLER.map(x => '<li>' + ikon('tamam') + '<span>' + kac(x) + '</span></li>').join('')
      + '</ul></section>';
  }

  function karsilaGovde(){
    const not = kapiNotu(), kurulum = kurulumMu(), kayitVar = kayitAcikMi();
    const l = kurulum ? [] : hatirlananlar();
    const hesaplar = l.length
      ? '<ul class="hesap-kapi__hesaplar" aria-label="Bu cihazdaki hesaplar">' + l.map(x =>
          '<li class="hesap-kapi__hesap">'
          + '<button type="button" class="hesap-kapi__hesap-sec" data-hesap="hatirla" data-ad="' + kac(x.a) + '">'
          +   avatar(x.g || x.a, x.k, 40)
          +   '<span class="hesap-kapi__hesap-ad"><b>' + kac(x.g || x.a) + '</b><small>@' + kac(x.a) + '</small></span></button>'
          + '<button type="button" class="hesap-kapi__unut" data-hesap="unut" data-ad="' + kac(x.a) + '"'
          +   ' aria-label="' + kac('«' + x.a + '» hesabını bu cihazdan unut') + '" title="Bu cihazdan unut">' + ikon('kapat') + '</button>'
          + '</li>').join('') + '</ul>'
      : '';
    const dugmeler = [];
    if(!kurulum){
      dugmeler.push('<button type="button" class="' + (l.length ? 'hesap__ikinci' : 'hesap__ana') + ' hesap__tam"'
        + ' data-hesap="gorunum" data-gorunum="giris">' + (l.length ? 'Başka hesapla giriş yap' : 'Giriş yap') + '</button>');
    }
    if(kayitVar){
      dugmeler.push('<button type="button" class="' + (kurulum ? 'hesap__ana' : 'hesap__ikinci') + ' hesap__tam"'
        + ' data-hesap="gorunum" data-gorunum="kayit">Hesap oluştur</button>');
    }
    return '<div class="hesap-kapi__marka hesap-kapi__marka--ana">'
      + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">Hoş geldin</h1>'
      + '<p class="hesap-kapi__alt">' + (kurulum ? 'İlk hesabı aç, dört sistem birlikte açılsın.'
        : l.length ? 'Hesabını seç, kaldığın yerden devam et.' : 'Tek hesap, dört sistem.') + '</p></div>'
      + (not ? '<p class="hesap__not hesap-kapi__not">' + kac(not) + '</p>' : '')
      + hesaplar
      + (dugmeler.length ? '<div class="hesap-kapi__menu">' + dugmeler.join('') + '</div>' : '')
      + (kurulum ? '' : '<button type="button" class="hesap-kapi__kodla" data-hesap="gorunum" data-gorunum="bagla">'
        + ikon('qr', 'hesap-ikon') + '<span><b>Kodla bağlan</b> · girişli cihazından, şifre yazmadan</span></button>')
      + '<button type="button" class="hesap-kapi__beta" data-hesap="beta"><b>Beta girişi</b> · hesapsız, yalnız bu cihazda</button>';
  }

  /* Altı haneli kod alanı (doğrulayıcı ya da bağlama kodu): tek alan,
     büyük rakam; telefon klavyesi rakamdır, SMS/anahtarlık önerisi gelir.
     Altı hane yazılınca form kendiliğinden gönderilir (bagla(): data-kod). */
  function kodAlani(id, etiket, deger){
    return '<label class="hesap__alan hesap__alan--kod" for="' + id + '"><span>' + kac(etiket) + '</span>'
      + '<input id="' + id + '" class="hesap__kod" type="text" inputmode="numeric" autocomplete="one-time-code"'
      + ' maxlength="7" required data-kod="6" placeholder="000 000" spellcheck="false" value="' + kac(deger || '') + '"/></label>';
  }

  function kapiBaslik(baslik, alt, geri){
    return '<button type="button" class="hesap-kapi__geri" data-hesap="gorunum" data-gorunum="' + (geri || 'karsila') + '"'
      + ' aria-label="' + (geri === 'giris' ? 'Girişe dön' : 'Ana menüye dön') + '">' + ikon('geri') + '</button>'
      + '<div class="hesap-kapi__marka">'
      + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">' + kac(baslik) + '</h1>'
      + (alt ? '<p class="hesap-kapi__alt">' + kac(alt) + '</p>' : '') + '</div>';
  }

  function kapiGovde(){
    const g = kapi.gorunum;
    if(g === 'karsila' || !KAPI_SIRA[g]) return karsilaGovde();
    const mesaj = '<p class="hesap__mesaj" id="hesap-mesaj" role="alert" hidden></p>';
    const ana = metin => '<button type="submit" class="hesap__ana hesap__tam">' + metin + '</button>';
    /* İKİNCİ ADIM (söz 17): şifre doğru, kod bekleniyor. */
    if(g === 'kod'){
      const s = kapi.secili, yedek = !!kapi.yedekKip;
      return '<button type="button" class="hesap-kapi__geri" data-hesap="gorunum" data-gorunum="giris" aria-label="Girişe dön">'
        + ikon('geri') + '</button>'
        + '<div class="hesap-kapi__marka">'
        + (s ? avatar(s.g || s.a, s.k, 56) : '<span class="hesap-kapi__rozet">' + ikon('kalkan') + '</span>')
        + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">' + (yedek ? 'Yedek kod' : 'Doğrulama kodu') + '</h1>'
        + '<p class="hesap-kapi__alt">' + (yedek ? 'Kaydettiğin yedek kodlardan birini yaz; her biri bir kez geçer.'
          : 'Doğrulayıcı uygulamandaki 6 haneli kodu yaz.') + '</p></div>'
        + '<form class="hesap__form" data-hesap-form="kod" data-ayar-disi>'
        + (yedek ? alanHtml('hesap-kod', 'Yedek kod', 'text', 'class="hesap__kod hesap__kod--yedek" autocomplete="off" '
            + 'autocapitalize="characters" autocorrect="off" spellcheck="false" required minlength="8" maxlength="9" placeholder="XXXX-XXXX"')
          : kodAlani('hesap-kod', 'Kod'))
        + mesaj + ana('Doğrula') + '</form>'
        + '<div class="hesap-kapi__baglar"><button type="button" class="hesap-kapi__bag" data-hesap="yedek-kip">'
        + (yedek ? 'Uygulamadaki kodu kullan' : 'Telefonun yanında değil mi? Yedek kod kullan') + '</button></div>';
    }
    /* KODLA BAĞLAN (söz 18). Telefon uygulamasında bilgisayarın adresi de. */
    if(g === 'bagla'){
      return kapiBaslik('Kodla bağlan', 'Girişli cihazında Hesap › Cihazlar › Yeni cihaz bağla’ya dokun.')
        + '<form class="hesap__form" data-hesap-form="bagla" data-ayar-disi>' + adresAlani()
        + kodAlani('hesap-kod', 'Bağlama kodu', kapi.kod)
        + mesaj + ana('Bağlan') + '</form>'
        + '<p class="hesap__not hesap-kapi__not">Kod 5 dakika geçerli ve tek kullanımlık.</p>';
    }
    if(g === 'kayit'){
      return kapiBaslik('Hesap oluştur', kurulumMu() ? kapiNotu() : '')
        + '<form class="hesap__form" data-hesap-form="kayit" data-ayar-disi>' + adresAlani()
        + alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK)
        + sifreAlani('hesap-parola', 'Şifre', 'new-password', true)
        + sifreAlani('hesap-parola2', 'Şifre (tekrar)', 'new-password')
        + CAPS
        + '<p class="hesap-kapi__ara">Şifreni unutursan</p>'
        + alanHtml('hesap-soru', 'Kendine bir soru', 'text',
          'required minlength="4" maxlength="120" autocomplete="off" placeholder="Örn. İlk öğretmenimin adı?"')
        + alanHtml('hesap-cevap', 'Cevabın', 'text', CEVAP_EK)
        + mesaj + ana('Hesap oluştur') + '</form>';
    }
    if(g === 'unuttum' && !kapi.soru){
      return kapiBaslik('Şifreni yenile', 'Kullanıcı adını yaz', 'giris')
        + '<form class="hesap__form" data-hesap-form="soru" data-ayar-disi>' + adresAlani()
        + alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK + ' value="' + kac(kapi.ad) + '"')
        + mesaj + ana('Devam') + '</form>';
    }
    if(g === 'unuttum'){
      return kapiBaslik('Şifreni yenile', 'Kendi sorunu cevapla', 'giris')
        + '<p class="hesap-kapi__soru">' + kac(kapi.soru) + '</p>'
        + '<form class="hesap__form" data-hesap-form="kurtar" data-ayar-disi>'
        + alanHtml('hesap-cevap', 'Cevabın', 'text', CEVAP_EK)
        + sifreAlani('hesap-parola', 'Yeni şifre', 'new-password', true)
        + sifreAlani('hesap-parola2', 'Yeni şifre (tekrar)', 'new-password')
        + CAPS + mesaj + ana('Şifreyi yenile') + '</form>';
    }
    /* Giriş. Hatırlanan hesap seçildiyse ad sorulmaz: monogram ve ad. */
    const s = kapi.secili;
    const bas = s
      ? '<button type="button" class="hesap-kapi__geri" data-hesap="gorunum" data-gorunum="karsila" aria-label="Ana menüye dön">'
        + ikon('geri') + '</button>'
        + '<div class="hesap-kapi__marka">' + avatar(s.g || s.a, s.k, 64)
        + '<h1 class="hesap-kapi__baslik" id="hesap-kapi-baslik">' + kac(s.g || s.a) + '</h1>'
        + '<p class="hesap-kapi__alt">@' + kac(s.a) + '</p></div>'
      : kapiBaslik('Giriş yap', '');
    return bas
      + '<form class="hesap__form" data-hesap-form="giris" data-ayar-disi>' + adresAlani()
      + (s ? '<input id="hesap-ad" type="hidden" autocomplete="username" value="' + kac(s.a) + '"/>'
        : alanHtml('hesap-ad', 'Kullanıcı adı', 'text', 'autocomplete="username" ' + AD_EK))
      + sifreAlani('hesap-parola', 'Şifre', 'current-password')
      + CAPS + mesaj + ana('Giriş yap') + '</form>'
      + '<div class="hesap-kapi__baglar">'
      +   '<button type="button" class="hesap-kapi__bag" data-hesap="unuttum">Şifremi unuttum</button>'
      +   (s ? '<button type="button" class="hesap-kapi__bag" data-hesap="gorunum" data-gorunum="giris">Başka hesap</button>' : '')
      + '</div>';
  }

  function kapiAcikMi(){ return !!(typeof document !== 'undefined' && document.querySelector('[data-hesap-kapi]')); }

  /* ------------------------------------------------------- seçim sayfası (söz 15, 16) */

  function girisHazir(){
    if(typeof document !== 'undefined') document.documentElement.classList.add('giris-hazir');
  }

  const OZET = 'lifeos_ozet_';
  const OZET_SATIR = 4, OZET_UZUN = 80, OZET_GUN = 7, OZET_DON = 3600;
  const KES_AD = { measured:'ölçüldü', computed:'hesaplandı', estimated:'tahmin', missing:'veri yok' };
  const VARLIK = { amp:'&', lt:'<', gt:'>', quot:'"', '#39':"'" };
  function duzMetin(html){
    return String(html == null ? '' : html).replace(/<[^>]*>/g, ' ')
      .replace(/&(amp|lt|gt|quot|#39);/g, (_, v) => VARLIK[v]).replace(/\s+/g, ' ').trim();
  }
  const sade = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
  /* Vitrin maddesi → [ust, metin, kesinlik]. `sayi` HTML'dir (LIFEOS.SAYI),
     ust/cumle/vurgu düz metin (vitrin kaçışlar). Eksik sayı yazılmaz (sıfır değil). */
  function ozetSatiri(m){
    if(!m) return null;
    const k = (String(m.sayi || '').match(/sayi--(measured|computed|estimated|missing)/) || [])[1] || null;
    const sayi = m.sayi && k !== 'missing' ? duzMetin(m.sayi) : '';
    const metin = ([sayi, sade(m.cumle)].filter(Boolean).join(' ') || sade(m.vurgu)).slice(0, OZET_UZUN);
    const ust = sade(m.ust).slice(0, 32);
    if(!ust || !metin || k === 'missing') return null;
    return [ust, metin, k];
  }
  function ozetHam(modul){
    const v = cerezOku(OZET + modul);
    return v && typeof v === 'object' && Number.isFinite(v.t) && v.d && typeof v.d === 'object' ? v : null;
  }
  /* modul: 'ays' | 'spi' | 'esp'; id: dönen kartın kimliği (iki kart birbirini silmez). */
  function ozetYaz(modul, id, maddeler){
    if(!/^(ays|spi|esp)$/.test(String(modul)) || !id) return false;
    const satirlar = (maddeler || []).map(ozetSatiri).filter(Boolean).slice(0, OZET_SATIR);
    const v = ozetHam(modul) || { t:0, d:{} };
    v.d[String(id).slice(0, 24)] = satirlar;
    v.t = ortam.simdi();
    const guvenli = ortam.konum().protocol === 'https:' ? '; Secure' : '';
    ortam.cerez.yaz(OZET + modul + '=' + encodeURIComponent(JSON.stringify(v))
      + '; Path=/; Max-Age=' + (OZET_GUN + 1) * 86400 + '; SameSite=Strict' + guvenli);
    return true;
  }
  /* Kartlar sırayla karışır: her dönen karttan önce birincisi, sonra ikincisi. */
  function ozetOku(modul){
    const v = ozetHam(modul);
    if(!v || ortam.simdi() - v.t > OZET_GUN * 864e5) return null;
    const listeler = Object.keys(v.d).map(k => (Array.isArray(v.d[k]) ? v.d[k] : []));
    const satirlar = [];
    for(let i = 0; satirlar.length < OZET_SATIR && listeler.some(l => l.length > i); i++){
      listeler.forEach(l => {
        const x = l[i];
        if(satirlar.length < OZET_SATIR && Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string'){
          satirlar.push({ u:x[0], m:x[1], k:KES_AD[x[2]] ? x[2] : null });
        }
      });
    }
    return satirlar.length ? { t:v.t, satirlar } : null;
  }
  function ozetZamani(t){
    const simdi = new Date(ortam.simdi()), d = new Date(t);
    const gun = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const fark = Math.round((gun(simdi) - gun(d)) / 864e5);
    if(fark <= 0) return 'bugün ' + saatMetni(t);
    if(fark === 1) return 'dün';
    return fark + ' gün önce';
  }
  let ozetId = null;
  function ozetCiz(){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-ozet]').forEach(el => {
      const o = ozetOku(el.getAttribute('data-ozet'));
      el.hidden = !o;
      if(!o){ el.innerHTML = ''; return; }
      el.innerHTML = '<span class="kart__ozet-sahne">' + o.satirlar.map((x, i) =>
          '<span class="kart__ozet-satir' + (i ? '' : ' is-on') + '"><b>' + kac(x.u) + '</b> ' + kac(x.m)
          + (x.k ? ' <i>' + KES_AD[x.k] + '</i>' : '') + '</span>').join('') + '</span>'
        + '<span class="kart__ozet-ne">' + kac(ozetZamani(o.t)) + '</span>';
    });
    if(ozetId == null) ozetId = ortam.zamanla(ozetDondur, OZET_DON);
  }
  function ozetDondur(){
    ozetId = null;
    if(typeof document === 'undefined') return;
    /* Giden satır yukarı solar, gelen aşağıdan belirir (sunucu.py stili). */
    document.querySelectorAll('.kart__ozet-sahne').forEach(sahne => {
      const l = sahne.children;
      if(l.length < 2) return;
      const i = Array.prototype.findIndex.call(l, x => x.classList.contains('is-on'));
      Array.prototype.forEach.call(l, x => x.classList.remove('is-giden'));
      if(i >= 0){ l[i].classList.remove('is-on'); l[i].classList.add('is-giden'); }
      l[(i + 1) % l.length].classList.add('is-on');
    });
    ozetId = ortam.zamanla(ozetDondur, OZET_DON);
  }
  function azaltilmis(){ try{ return !!ortam.azalt(); }catch(e){ return true; } }
  /* Kart yeni içeriğin boyuna yumuşakça uzar/kısalır (zıplamaz). */
  let boyId = null;
  function kapiTazele(yon){
    const kart = typeof document !== 'undefined' && document.querySelector('[data-hesap-kapi] .hesap-kapi__kart');
    if(!kart) return;
    const once = yon && !azaltilmis() ? kart.offsetHeight : 0;
    if(boyId != null){ clearTimeout(boyId); boyId = null; kart.style.height = ''; kart.style.transition = ''; }
    kart.innerHTML = '<div class="hesap-kapi__ic' + (yon ? ' is-' + yon : '') + '">' + kapiGovde() + '</div>';
    kapi.ilk = false;
    const kok = kart.closest('[data-hesap-kapi]');
    if(kok) kok.classList.toggle('is-form', kapi.gorunum !== 'karsila');
    const sonra = once ? kart.offsetHeight : 0;
    if(once && sonra && Math.abs(once - sonra) > 2){
      kart.style.height = once + 'px';
      void kart.offsetHeight;
      kart.style.transition = 'height .42s cubic-bezier(.32,.72,0,1)';
      kart.style.height = sonra + 'px';
      boyId = setTimeout(() => { boyId = null; kart.style.height = ''; kart.style.transition = ''; }, 460);
    }
    /* Ana menüde odak karttadır (halka çizilmez); formda ilk alana gider
       (telefonda klavye kendiliğinden açılmasın diye gitmez). */
    const ilk = kapi.gorunum === 'karsila' ? null : kart.querySelector('input:not([type=hidden])');
    const tel = !!(L.KABUK && L.KABUK.telefonMu && L.KABUK.telefonMu());
    const odakla = () => { try{ (ilk && !tel ? ilk : kart).focus({ preventScroll:true }); }catch(e){ /* odaklanamadı */ } };
    /* Marka perdesi açıkken odak onundur (aria-modal, «Geç»; seviye/perde.js):
       kapı odağı perde kalkınca alır. Eskiden açılışta kapı odağı perdeden
       çalıyordu ve kartın odak halkası buğulu camın arkasında beliriyordu. */
    if(perdeAcik()) perdeBitince(() => { if(kapiAcikMi() && kart.isConnected) odakla(); });
    else odakla();
  }
  function perdeAcik(){
    return !!(typeof document !== 'undefined' && document.querySelector('.perde:not(.perde--kapaniyor)'));
  }
  let perdeBekleyen = null;
  function perdeBitince(fn){
    perdeBekleyen = fn;
    const bitis = Date.now() + 20000;
    (function bak(){
      if(perdeBekleyen !== fn) return;                 // yenisi geldi
      if(!perdeAcik() || Date.now() > bitis){ perdeBekleyen = null; fn(); return; }
      setTimeout(bak, 150);
    })();
  }
  function kapiGit(g, ek){
    const once = kapi.gorunum;
    /* Koddan girişe dönerken seçili hesap kalır (ad yeniden sorulmaz). */
    const kalan = once === 'kod' && g === 'giris' ? { secili:kapi.secili } : {};
    kapi = Object.assign(KAPI_BOS(), { gorunum:g, ilk:false }, kalan, ek || {});
    kapiTazele((KAPI_SIRA[g] || 0) < (KAPI_SIRA[once] || 0) ? 'geri' : 'ileri');
  }
  function kapiAc(g, ek){
    if(typeof document === 'undefined' || !document.body) return;
    if(L.KABUK && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    merkezKapat();
    kapi = Object.assign(KAPI_BOS(), { gorunum:g || 'karsila' }, ek || {});
    if(!kapiAcikMi()){
      const el = document.createElement('div');
      el.className = 'hesap-kapi';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'hesap-kapi-baslik');
      el.setAttribute('data-hesap-panel', '');
      el.setAttribute('data-hesap-kapi', '');
      el.innerHTML = '<div class="hesap-kapi__sahne">' + tanitimHtml() + '<div class="hesap-kapi__kart" tabindex="-1"></div></div>';
      document.body.appendChild(el);
      document.documentElement.classList.add('hesap-kapi-acik');
    }
    kapiTazele();
  }
  /* Kapı çekilirken solar (söz 15): kapı sayılmaz (data-hesap-kapi kalkar),
     odak almaz, yalnız görünür; seçim sayfası/modül aynı anda belirir.
     `anim:false` (sıfırlama) ya da azaltılmış hareket: anında. */
  const KAPI_CIKIS_MS = 420;
  function kapiKapat(anim){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-hesap-kapi]');
    document.documentElement.classList.remove('hesap-kapi-acik');
    if(!el) return;
    if(anim === false || azaltilmis()){ el.remove(); return; }
    el.removeAttribute('data-hesap-kapi');
    el.setAttribute('data-hesap-kapi-cikis', '');
    el.setAttribute('aria-hidden', 'true');
    el.inert = true;
    el.classList.add('is-cikis');
    ortam.zamanla(() => el.remove(), KAPI_CIKIS_MS);
  }

  /* ------------------------------------------------------- hesap işleri (sayfa)

     Sunucudaki profil, cihazlar ve yönetim. Hepsi oturumun jetonuyla;
     ağ hatası çağırana gider (sayfa söyler), modülü hiçbiri bekletmez. */
  async function api(yol, govde){
    const o = oturum(), base = sunucuAdresi();
    if(!o || base === null){ const h = new Error('Önce giriş yap.'); h.kod = 401; throw h; }
    return istek(base, yol, govde || null, o.j, govde ? 30000 : 15000);
  }
  async function ben(){
    const v = await api('/api/hesap/ben');
    if(v && v.kullanici) profilYaz(v.kullanici);
    if(v && typeof v.kayit === 'boolean' && sunucu) sunucu.kayit = v.kayit;
    return v;
  }
  /* ek: { dogum, hitap, eposta } — verilmeyen alan sunucuda değişmez. */
  async function profilAyarla(gorunenAd, renk, ek){
    const v = await api('/api/hesap/profil', Object.assign({ gorunen_ad:gorunenAd, renk }, ek || {}));
    profilYaz(v.kullanici);
    return v.kullanici;
  }
  async function etkinlik(){ return (await api('/api/hesap/etkinlik')).olaylar || []; }
  /* Bilgisayardaki kopyanın tamamı tek JSON dosyası (sunucu sözü 13). */
  async function disaAktar(){
    const v = await api('/api/hesap/disa');
    const o = oturum() || {}, d = new Date(ortam.simdi());
    const gun = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const ad = 'lifeos-hesap-' + String(o.a || 'hesap').replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü_.-]/g, '') + '-' + gun + '.json';
    const metin = JSON.stringify(v, null, 1);
    await ortam.indir(ad, metin);
    let n = 0;
    Object.values(v.alanlar || {}).forEach(x => { n += Object.keys(x).length; });
    return { ad, kayit:n, bayt:metin.length };
  }
  /* Hesabı siler (sunucu sözü 13). Bu cihazdaki veri yerinde kalır; bağ
     çözülür, hatırlanan hesap unutulur, giriş ekranı gelir. */
  async function hesabiSil(parola){
    const o = oturum();
    await api('/api/hesap/sil', { parola });
    cerezSil(CEREZ);
    if(o) unut(o.a);
    const a = alan();
    if(a) baglantiCoz(a);
    merkezKapat();
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    sunucu = Object.assign({}, sunucu);
    await yokla();
    durumYaz('giris', 'Hesap silindi. Bu cihazdaki veri yerinde duruyor.');
    if(kapiGerekli()) kapiAc();
  }
  async function cihazlar(){ return (await api('/api/hesap/cihazlar')).cihazlar || []; }
  async function cihazCikar(id){
    const v = await api('/api/hesap/cihaz-cikar', { id });
    if(v.bu) oturumKapandi();
    return v;
  }
  async function otekilerdenCik(){ return (await api('/api/hesap/otekilerden-cik', {})).n; }
  async function kullanicilar(){ return api('/api/hesap/kullanicilar'); }
  /* Deponun yedeği (sunucu sözü 20; admin). */
  async function yedekDurum(){ return api('/api/hesap/yedekler'); }
  async function yedekle(){ return api('/api/hesap/yedekle', {}); }
  async function yedekAyar(ikinci){ return api('/api/hesap/yedek-ayar', { ikinci }); }
  async function yedekOnizle(ad){ return api('/api/hesap/yedek-onizle', { ad }); }
  /* Yedek dosya olarak (sunucu sözü 20; admin, bilgisayar, şifre). Cevap
     JSON değil, dosyanın kendisi; hata JSON gelir. */
  async function hamIstek(yol, secenek){
    const o = oturum(), base = sunucuAdresi();
    if(!o || base === null){ const h = new Error('Önce giriş yap.'); h.kod = 401; throw h; }
    let r;
    try{
      r = await ortam.fetch(base + yol, Object.assign({ method:'POST', cache:'no-store', credentials:'omit' }, secenek,
        { headers:Object.assign({ 'X-LifeOS':'hesap', Authorization:'Bearer ' + o.j }, secenek.headers || {}) }));
    }catch(e){ const h = new Error('Sunucuya ulaşılamadı.'); h.kod = 0; throw h; }
    if(!r.ok){
      let v = null;
      try{ v = await r.json(); }catch(e){ v = null; }
      const h = new Error((v && v.hata) || ('Sunucu cevap vermedi (' + r.status + ').'));
      h.kod = r.status;
      throw h;
    }
    return r;
  }
  async function yedekIndir(ad, parola){
    const r = await hamIstek('/api/hesap/yedek-indir', { headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ ad, parola }) });
    const veri = await r.arrayBuffer();
    await ortam.indir('lifeos-' + ad, veri, 'application/octet-stream');
    return { ad:'lifeos-' + ad, bayt:veri.byteLength };
  }
  async function yedekYukle(dosya){
    if(!dosya || !dosya.size) throw new Error('Önce bir yedek dosyası seç.');
    const r = await hamIstek('/api/hesap/yedek-yukle', { headers:{ 'Content-Type':'application/octet-stream' }, body:dosya });
    return r.json();
  }
  /* Geri yükleme bütün oturumları kapatır (bu cihazınki de): giriş ekranı
     gelir; cihazdaki kayıtlar yerinde, girince eşitlenir (söz 23). */
  async function geriYukle(ad, parola){
    const v = await api('/api/hesap/geri-yukle', { ad, parola });
    cerezSil(CEREZ);
    merkezKapat();
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    durumYaz('giris', 'Hesap deposu yedekten geri yüklendi; yeniden giriş yap. Bu cihazdaki kayıtlar yerinde, girince eşitlenir.');
    if(kapiGerekli()) kapiAc();
    return v;
  }
  async function yonet(id, degisim){
    const k = (await api('/api/hesap/yonet', Object.assign({ id }, degisim))).kullanici;
    profilYaz(k);                     // kendi rolü değiştiyse çerez de
    return k;
  }
  async function kayitAyarla(acik){
    const v = await api('/api/hesap/ayar', { kayit:!!acik });
    if(sunucu) sunucu.kayit = v.kayit;
    return v.kayit;
  }
  async function kullaniciEkle(ad, parola){ return api('/api/hesap/kullanici', { ad, parola }); }

  /* BAĞLANTILAR (sözler 17–19; sunucu sözleri 14–17). */
  async function baglantilar(){ return api('/api/hesap/baglantilar'); }
  async function ikiAdimBaslat(parola){ return api('/api/hesap/iki-adim/baslat', { parola }); }
  async function ikiAdimOnayla(kod){ return (await api('/api/hesap/iki-adim/onayla', { kod })).yedek || []; }
  async function ikiAdimKapat(parola, kod){ return api('/api/hesap/iki-adim/kapat', { parola, kod }); }
  async function yedekYenile(parola){ return (await api('/api/hesap/iki-adim/yedek', { parola })).yedek || []; }
  async function bagKoduAc(){ return api('/api/hesap/bag-kodu', {}); }
  async function bagDurum(id){ return api('/api/hesap/bag-durum', { id }); }
  async function bagKapat(id){ return api('/api/hesap/bag-kapat', { id }); }
  /* oku: anahtar günün özetini de okuyabilsin (Siri, sunucu sözü 21). */
  async function anahtarAc(parola, ad, oku){
    return api('/api/hesap/anahtar', { parola, ad, yetki:oku ? ['kayit', 'oku'] : 'kayit' });
  }
  async function anahtarSil(id){ return api('/api/hesap/anahtar-sil', { id }); }
  async function takvimAc(yenile){ return (await api('/api/hesap/takvim', { yenile:!!yenile })).takvim; }
  async function takvimKapat(){ return (await api('/api/hesap/takvim-kapat', {})).takvim; }
  /* Cihaza ad (söz 21); döner: tazelenmiş cihaz listesi. */
  async function cihazAdlandir(id, ad){ return (await api('/api/hesap/cihaz-ad', { id, ad })).cihazlar || []; }

  /* YENİ GİRİŞ UYARISI (söz 22). Sunucu son olayları ve hangisinin bu
     cihazdan olduğunu verir; hangisinin GÖRÜLDÜĞÜ bu cihazda tutulur.
     Bu cihaz ilk kez bakıyorsa eskiler görülmüş sayılır: geçmiş için
     alarm çalınmaz, bundan sonrası söylenir. */
  const UYARI_ARALIK = 300000;
  const UYARI_TUR = { giris:'Yeni giriş', bag:'Kodla bağlanan cihaz', kurtar:'Şifre kurtarıldı',
    yanlis:'Yanlış şifre denemesi', 'kurtar-yanlis':'Yanlış kurtarma cevabı', 'kod-yanlis':'Yanlış doğrulama kodu',
    parola:'Şifre değişti', 'iki-adim-kapat':'İki adımlı doğrulama kapandı' };
  /* «Görüldü» kapıya bakmayan çerezdedir (lifeos_gordu = { hesap: olay no }):
     modüller ayrı kapıda, depoları ayrı; aynı uyarıya dört kapıda ayrı
     «Bendim» denmesin. Yalnız bu cihazdadır, sunucuya gitmez. */
  const GORDU = 'lifeos_gordu';
  function gorduAnahtar(){ const o = oturum(); return o ? String(o.h || o.a) : ''; }
  function gorduOku(k){
    const m = cerezOku(GORDU);
    return m && typeof m === 'object' && typeof m[k] === 'number' ? m[k] : null;
  }
  function gorduYaz(k, id){
    const m = cerezOku(GORDU), y = {};
    if(m && typeof m === 'object') Object.keys(m).slice(-3).forEach(x => { if(typeof m[x] === 'number') y[x] = m[x]; });
    y[k] = id;
    cerezYaz(GORDU, y);
  }
  function uyariHesapla(liste){
    const k = gorduAnahtar();
    const enBuyuk = (liste || []).reduce((a, u) => Math.max(a, Number(u.id) || 0), 0);
    let gordu = k ? gorduOku(k) : null;
    if(k && gordu === null){ gorduYaz(k, enBuyuk); gordu = enBuyuk; }     // ilk bakış: geçmiş görülmüş sayılır
    uyari = { liste:liste || [], yeni:(liste || []).filter(u => !u.bu && Number(u.id) > gordu && UYARI_TUR[u.tur]) };
    dugmeTazele();
    cipTazele();
    return uyari;
  }
  async function uyarilar(){
    const l = (await api('/api/hesap/uyarilar')).uyarilar || [];
    return uyariHesapla(l);
  }
  function uyariGordum(){
    const k = gorduAnahtar();
    if(k) gorduYaz(k, (uyari.liste || []).reduce((a, u) => Math.max(a, Number(u.id) || 0), 0));
    uyari = { liste:uyari.liste, yeni:[] };
    dugmeTazele();
    cipTazele();
  }

  /* Oturum sunucuda kapanmış (başka cihazdan çıkarıldı, süresi doldu). */
  function oturumKapandi(){
    cerezSil(CEREZ);
    durumYaz('giris', 'Oturum kapandı; yeniden giriş yap. Bu cihazdaki değişiklikler sırada bekliyor.');
    merkezKapat();
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    if(kapiGerekli()) kapiAc();
  }

  /* ------------------------------------------------------- hesap sayfası (söz 12)

     iOS Ayarlar gibi: üstte kimlik (monogram, görünen ad, plan), altında
     gruplu satırlar; satır alt sayfayı yandan kaydırarak açar, «‹» döner.
     Veri sunucudan gelir, bellekte durur; sunucuya ulaşılamazsa çerezdeki
     profil gösterilir ve bu söylenir. Sayfa [data-hesap-panel]'dir:
     içindeki alanlar modülün «yazıyor mu?» denetimine sayılmaz. */
  const SAYFA_AD = { kok:'Hesap', profil:'Profil', plan:'Plan', cihazlar:'Cihazlar', guvenlik:'Güvenlik',
    esitleme:'Eşitleme', yonetim:'Yönetim', kisi:'Kullanıcı', etkinlik:'Etkinlik', verin:'Verin',
    baglantilar:'Bağlantılar', ikiadim:'İki adımlı doğrulama', takvim:'Takvim aboneliği',
    anahtarlar:'Kısayollar ve otomasyon', gelen:'Gelen kutusu', bagla:'Yeni cihaz bağla', cihaz:'Cihaz', yedek:'Yedekler' };
  /* Oturumun nasıl açıldığı (sunucu sözü 18). */
  const YONTEM_AD = { sifre:'Şifreyle', 'iki-adim':'Şifre ve doğrulama koduyla', yedek:'Şifre ve yedek kodla',
    kod:'Bağlama koduyla', kurtar:'Kurtarma sorusuyla', kayit:'Hesap açılırken', kur:'İlk kurulumda' };
  function tarihSaat(ms){
    if(!ms) return '';
    const d = new Date(ms);
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + saatMetni(ms);
  }
  const adresAd = ip => (!ip ? '' : ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' ? 'Bu bilgisayar' : ip);
  function cihazBul(){
    return merkez && merkez.cihazlar ? merkez.cihazlar.find(c => c.id === merkez.cihaz) || null : null;
  }
  /* Uyarı kartı (söz 22): en yeni olay, «Bendim» ve «İncele». Zemin nötr,
     durumu simgenin rengi söyler (dolgusuz durum kararı). */
  function uyariKarti(){
    const l = uyari.yeni;
    if(!l.length) return '';
    const u = l[0], yanlis = /yanlis/.test(u.tur);
    return '<div class="hesap-olaykart' + (yanlis ? ' is-dikkat' : '') + '" role="status">'
      + ikon(yanlis ? 'uyari' : 'giris', 'hesap-olaykart__ikon')
      + '<div class="hesap-olaykart__metin"><b>' + kac(UYARI_TUR[u.tur] || 'Güvenlik olayı') + (u.cihaz_ad ? ': ' + kac(u.cihaz_ad) : '') + '</b>'
      + '<small>' + kac([sonMetni(u.zaman), adresAd(u.ip)].filter(Boolean).join(' · '))
      + (l.length > 1 ? ' · ' + (l.length - 1) + ' olay daha' : '') + '</small>'
      + '<span class="hesap-olaykart__eylem">'
      + '<button type="button" class="hesap__ikinci" data-hesap="uyari-gordum">Bendim</button>'
      + '<button type="button" class="hesap__ikinci" data-hesap="uyari-incele" data-oturum="' + (u.oturum == null ? '' : Number(u.oturum)) + '">İncele</button>'
      + '</span></div></div>';
  }

  /* Etkinlik defterindeki olay türleri (sunucu sözleri 11, 14–17). */
  const OLAY = {
    giris:['giris', 'Giriş'], yanlis:['uyari', 'Yanlış şifre'], kayit:['ekle', 'Hesap açıldı'],
    kurtar:['soru', 'Şifre soruyla yenilendi'], 'kurtar-yanlis':['uyari', 'Kurtarma cevabı yanlış'],
    parola:['anahtar', 'Şifre değişti'], soru:['soru', 'Kurtarma sorusu değişti'], cikis:['cikis', 'Çıkış'],
    cihaz:['cihazlar', 'Cihazdan çıkıldı'], otekiler:['cihazlar', 'Öteki cihazlardan çıkıldı'],
    yonetim:['yonetim', 'Admin değişikliği'],
    'iki-adim':['kalkan', 'İki adımlı doğrulama açıldı'], 'iki-adim-kapat':['kalkan', 'İki adımlı doğrulama kapandı'],
    yedek:['anahtar', 'Yedek kodlar yenilendi'], 'kod-yanlis':['uyari', 'Yanlış doğrulama kodu'],
    bag:['qr', 'Kodla cihaz bağlandı'], anahtar:['kisayol', 'Erişim anahtarı açıldı'],
    'anahtar-sil':['kisayol', 'Erişim anahtarı silindi'], takvim:['takvim', 'Takvim aboneliği'],
    'takvim-kapat':['takvim', 'Takvim aboneliği kapandı'], 'geri-yukle':['yedek', 'Depo yedekten geri yüklendi'],
    'yedek-indir':['indir', 'Yedek dosya olarak indirildi'], 'yedek-yukle':['yedek', 'Yedek dosyadan yüklendi'],
  };
  const YANLIS = { yanlis:1, 'kurtar-yanlis':1, 'kod-yanlis':1 };
  const AY_MS = 30 * 86400000;

  /* GÜVENLİK KONTROLÜ: hesabın dört kilidi, her biri bir satır. Bilinmeyen
     (sunucu cevabı gelmedi) «tamam» da «dikkat» de sayılmaz (AGENTS §1.7). */
  function kontrol(m){
    const ben = m.ben || {}, iki = ben.iki_adim, satirlar = [];
    if(iki){
      const az = iki.acik && iki.yedek_kalan <= 2;
      satirlar.push({ ikon:'kalkan', ad:'İki adımlı doğrulama', sayfa:'ikiadim', dikkat:!iki.acik || az,
        detay:!iki.acik ? 'Kapalı' : az ? iki.yedek_kalan + ' yedek kod kaldı' : 'Açık' });
    }
    if(typeof ben.soru_var === 'boolean'){
      satirlar.push({ ikon:'soru', ad:'Kurtarma sorusu', ac:'soru', dikkat:!ben.soru_var && !(iki && iki.acik),
        detay:ben.soru_var ? 'Ayarlı' : 'Ayarlı değil' });
    }
    if(m.cihazlar){
      const eski = m.cihazlar.filter(c => !c.bu && ortam.simdi() - (Number(c.son) || 0) > AY_MS).length;
      satirlar.push({ ikon:'cihazlar', ad:'Oturum açık cihazlar', sayfa:'cihazlar', dikkat:eski > 0,
        detay:eski ? eski + ' cihaz 30 gündür görünmedi' : String(m.cihazlar.length) });
    }
    if(m.etkinlik){
      const y = yanlisSayisi(m.etkinlik);
      satirlar.push({ ikon:'etkinlik', ad:'Son 7 gün', sayfa:'etkinlik', dikkat:y > 0,
        detay:y ? y + ' yanlış deneme' : 'Yanlış deneme yok' });
    }
    /* Deponun yedeği (sunucu sözü 20) yalnız admine. */
    const yd = ben.yedek;
    if(yd && ben.kullanici && ben.kullanici.rol === 'admin'){
      const h = yedekHatasi(yd);
      satirlar.push({ ikon:'yedek', ad:'Hesap deposunun yedeği', sayfa:'yedek', dikkat:!!h,
        detay:h || (yd.son ? sonMetni(yd.son) : 'Henüz yok') });
    }
    return satirlar;
  }
  /* Ana sayfadaki Güvenlik satırının sağı: iki adım açıksa «İki adım açık»,
     değilse kaç öneri olduğu. */
  function guvenlikKisa(m){
    const l = kontrol(m), n = l.filter(x => x.dikkat).length;
    const iki = m.ben && m.ben.iki_adim;
    if(!l.length) return { detay:'' };
    if(n) return { detay:n === 1 ? '1 öneri' : n + ' öneri', sinif:'is-dikkat' };
    return { detay:iki && iki.acik ? 'İki adım açık' : 'Yolunda' };
  }
  /* Yedekte dikkat gereken ne var? Yedek henüz hiç alınmadıysa (ilk
     istekte arkada alınıyor) dikkat değildir; eski ya da alınamadıysa. */
  const YEDEK_ESKI_MS = 2 * 86400000;
  function yedekHatasi(yd){
    if(!yd) return '';
    if(yd.hata) return 'Son yedek alınamadı';
    if(yd.son && ortam.simdi() - yd.son > YEDEK_ESKI_MS) return Math.floor((ortam.simdi() - yd.son) / 86400000) + ' gündür yedek yok';
    if(yd.ikinci_hata) return 'İkinci yere yazılamadı';
    return '';
  }
  function yedekSatiri(m){
    const yd = (m.yedek && { son:(m.yedek.yedekler[0] || {}).zaman || null, hata:m.yedek.hata,
      ikinci_hata:m.yedek.ikinci.hata }) || (m.ben && m.ben.yedek);
    const h = yedekHatasi(yd);
    return { ikon:'yedek', ad:'Yedekler', sayfa:'yedek', sinif:h ? 'is-dikkat' : '',
      detay:h || (yd && yd.son ? sonMetni(yd.son) : '') };
  }
  function baglantiKisa(m){
    const b = m.ben && m.ben.baglantilar;
    if(!b) return '';
    const l = [];
    if(b.takvim) l.push('Takvim');
    if(b.anahtar) l.push(b.anahtar + ' anahtar');
    if(b.gelen_bekleyen) l.push(b.gelen_bekleyen + ' bekliyor');
    return l.join(' · ');
  }

  /* Bu cihazdan bilgisayara giden adresler (takvim, tarifler). Ev ağı
     (telefon, tablet) https kapısıdır; bilgisayarın kendisi 4180. Bu
     sayfa telefondan açıldıysa kendi adresi bilinir. */
  function evAdresleri(){
    const base = sunucuAdresi();
    if(base) return [base];
    const k = ortam.konum();
    if(base === '' && k.protocol === 'https:') return [k.origin || (k.protocol + '//' + k.host)];
    return (sunucu && Array.isArray(sunucu.ev_agi) ? sunucu.ev_agi : []).map(ip => 'https://' + ip + ':' + TELEFON_KAPI);
  }
  const pcMi = () => !ortam.yerelUygulama() && !!(sunucu && sunucu.yerel);

  /* Kopyalanacak bir adres ya da anahtar: tek satır, yanında «Kopyala». */
  function kopyaKutusu(metin, etiket){
    return '<div class="hesap-kopya"><code class="hesap-kopya__metin">' + kac(metin) + '</code>'
      + '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="kopyala" data-metin="' + kac(metin) + '"'
      + ' aria-label="' + kac((etiket || 'Metni') + ' kopyala') + '">' + ikon('kopyala', 'hesap-ikon') + '<span>Kopyala</span></button></div>';
  }
  function tanit(ikonAd, baslik, metin){
    return '<div class="hesap-tanit">' + ikon(ikonAd, 'hesap-tanit__ikon')
      + '<p class="hesap-tanit__baslik">' + kac(baslik) + '</p><p class="hesap-tanit__metin">' + kac(metin) + '</p></div>';
  }
  function adimlar(l){
    return '<ol class="hesap-adimlar">' + l.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  }
  function yedekHtml(l){
    return '<div class="hesap-yedek" role="status">'
      + tanit('anahtar', 'Yedek kodların', 'Telefonun yanında değilken her biri girişi bir kez açar. Bir yere yaz ya da indir; bir daha gösterilmez.')
      + '<ol class="hesap-yedek__liste">' + l.map(x => '<li><code>' + kac(x) + '</code></li>').join('') + '</ol>'
      + '<div class="hesap__eylem hesap-yedek__eylem">'
      + '<button type="button" class="hesap__ikinci" data-hesap="kopyala" data-metin="' + kac(l.join('\n')) + '">'
      + ikon('kopyala', 'hesap-ikon') + 'Kopyala</button>'
      + '<button type="button" class="hesap__ikinci" data-hesap="yedek-indir">' + ikon('indir', 'hesap-ikon') + 'İndir</button></div>'
      + '<button type="button" class="hesap__ana hesap__tam" data-hesap="yedek-tamam">Kaydettim</button></div>';
  }
  /* Tariflerde kullanılan istek: adres, başlık, gövde. Anahtar az önce
     açıldıysa (söz 19) içine yazılır, yoksa yer tutucu. */
  function tarifIstek(m){
    const a = m.yeniAnahtar ? m.yeniAnahtar.anahtar : 'lifeos_…';
    const ev = evAdresleri()[0];
    return { url:(ev || 'https://BİLGİSAYARIN-IP:' + TELEFON_KAPI) + '/api/hesap/gelen', pc:PC_KOK + '/api/hesap/gelen', a };
  }
  function istekKutusu(t){
    return '<dl class="hesap-istek">'
      + '<div><dt>Adres</dt><dd>' + kopyaKutusu(t.url, 'Adresi') + '</dd></div>'
      + '<div><dt>Yöntem</dt><dd><code>POST</code></dd></div>'
      + '<div><dt>Başlık</dt><dd><code>Authorization: Bearer ' + kac(t.a) + '</code></dd></div>'
      + '<div><dt>Gövde (JSON)</dt><dd><code>{"metin": "su 250"}</code><small>AYS ya da ESP için '
      +   '<code>"modul": "ays"</code> ya da <code>"esp"</code> ekle; yazılmazsa SPİ.</small></dd></div>'
      + '<div><dt>Önce dene</dt><dd>Aynı adrese aynı başlıkla gövdesiz <code>GET</code>: «Bağlantı tamam» döner, satır bırakmaz.</dd></div></dl>';
  }
  const HAFTA_MS = 7 * 86400000;
  function yanlisSayisi(l){
    const sinir = ortam.simdi() - HAFTA_MS;
    return (l || []).filter(o => YANLIS[o.tur] && o.zaman >= sinir).length;
  }
  function boyut(b){
    if(b == null) return '';
    if(b < 1024) return b + ' B';
    if(b < 1048576) return Math.max(1, Math.round(b / 1024)) + ' KB';
    return (b / 1048576).toLocaleString('tr-TR', { maximumFractionDigits:1 }) + ' MB';
  }
  function toplam(m){
    const ay = m && m.ben && m.ben.ayrinti;
    if(!ay) return null;
    let n = 0, b = 0;
    Object.keys(ay).forEach(a => { n += Number(ay[a].n) || 0; b += Number(ay[a].bayt) || 0; });
    return { n, b };
  }
  function bugunGun(){
    const d = new Date(ortam.simdi());
    return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function gunBasligi(ms){
    const s = sonMetni(ms);
    return /^bugün/.test(s) ? 'Bugün' : /^dün/.test(s) ? 'Dün' : s;
  }
  let merkez = null;

  function merkezAcikMi(){ return !!(typeof document !== 'undefined' && document.querySelector('[data-hesap-merkez]')); }
  function sayfa(){ return merkez ? merkez.yigin[merkez.yigin.length - 1] : 'kok'; }

  function kim(){
    const k = merkez && merkez.ben && merkez.ben.kullanici;
    if(k) return { ad:k.ad, g:k.gorunen_ad || k.ad, k:k.renk, r:k.rol, p:k.plan, pa:k.plan_ad, olusturma:k.olusturma };
    const o = oturum() || {};
    return { ad:o.a || '', g:o.g || o.a || '', k:o.k || 'mavi', r:o.r, p:o.p || 'ucretsiz', pa:o.pa || '', olusturma:'' };
  }
  function planBul(id){
    const l = merkez && merkez.ben && merkez.ben.planlar;
    return (l || []).find(p => p.id === id) || null;
  }
  function kisiBul(){
    return merkez && merkez.kullanicilar ? merkez.kullanicilar.find(u => u.id === merkez.kisi) || null : null;
  }
  function esitKisa(){
    if(!ayar || !ayar.depo) return '';
    const n = bekleyen();
    switch(hal.durum){
      case 'tamam': return n ? n + ' sırada' : 'Eşitlendi';
      case 'esitleniyor': return 'Eşitleniyor…';
      case 'cevrimdisi': return 'Çevrimdışı';
      case 'hata': case 'baska': return 'Sorun var';
      default: return '';
    }
  }
  /* Yüklenirken iskelet satırlar: sayfa zıplamaz, yazı yer değiştirmez.
     Durağandır (parlayan şerit yok); ekran okuyucu «Yükleniyor» duyar. */
  function yukleniyor(m){
    if(m.uyari) return '';
    return '<ul class="hesap-liste hesap-iskelet" aria-busy="true">' + [62, 44, 54].map(g =>
      '<li class="hesap-oge"><i class="hesap-iskelet__daire"></i><span class="hesap-oge__metin">'
      + '<i class="hesap-iskelet__cizgi" style="width:' + g + '%"></i><i class="hesap-iskelet__cizgi is-kisa"></i></span></li>').join('')
      + '</ul><p class="hesap__gizli" role="status">Yükleniyor…</p>';
  }
  function bilgi(dt, dd){ return '<div><dt>' + kac(dt) + '</dt><dd>' + kac(dd) + '</dd></div>'; }
  /* o.alt: adın altında küçük açıklama (Bağlantılar'da hangi uygulamalar). */
  function satir(o){
    const veri = o.sayfa ? 'data-hesap="sayfa" data-sayfa="' + o.sayfa + '"' : 'data-hesap="' + o.eylem + '"';
    return '<li><button type="button" class="hesap-satir' + (o.alt ? ' hesap-satir--iki' : '') + (o.sinif ? ' ' + o.sinif : '')
      + '" ' + veri + '>'
      + (o.ikon ? ikon(o.ikon, 'hesap-satir__ikon') : '')
      + (o.alt ? '<span class="hesap-oge__metin"><b>' + kac(o.ad) + '</b><small>' + kac(o.alt) + '</small></span>'
        : '<span class="hesap-satir__ad">' + kac(o.ad) + '</span>')
      + (o.detay != null ? '<span class="hesap-satir__detay"' + (o.detayId ? ' id="' + o.detayId + '"' : '') + '>'
        + kac(o.detay) + '</span>' : '')
      + (o.sayfa ? ikon('ileri', 'hesap-satir__ok') : '') + '</button></li>';
  }
  function acilir(anahtar, ikonAd, ad, detay, govde, sinif){
    const acik = !!(merkez && merkez.acik && merkez.acik[anahtar]);
    /* Öznitelik hesabın kendi ad alanında: modülün bölüm gizleme aracı
       (gizle.js) belgedeki her [data-ac] tıklamasını kendine alıyordu;
       bu bölümler modüllerde hiç açılmıyordu (2026-10-09). */
    return '<details class="hesap-ac" data-hesap-ac="' + anahtar + '"' + (acik ? ' open' : '') + '><summary class="hesap-satir'
      + (sinif ? ' ' + sinif : '') + '">'
      + ikon(ikonAd, 'hesap-satir__ikon') + '<span class="hesap-satir__ad">' + kac(ad) + '</span>'
      + (detay ? '<span class="hesap-satir__detay">' + kac(detay) + '</span>' : '')
      + ikon('ileri', 'hesap-satir__ok') + '</summary><div class="hesap-ac__ic">' + govde + '</div></details>';
  }
  const formMesaj = '<p class="hesap__mesaj" role="alert" hidden></p>';

  const SAYFALAR = {
    kok(m){
      const k = kim(), p = planBul(k.p), o = oturum() || {}, t = toplam(m);
      /* Özet: ölçülmemiş sayı «—»dır, sıfır değil (AGENTS §1.2). */
      const uye = k.olusturma ? Math.max(0, Math.floor((ortam.simdi() - new Date(k.olusturma).getTime()) / 86400000)) : null;
      const say = (deger, ad) => '<div><b>' + (deger == null ? '—' : kac(deger)) + '</b><span>' + ad + '</span></div>';
      const yanlis = yanlisSayisi(m.etkinlik);
      const sonGiris = (m.etkinlik || []).find(x => x.tur === 'giris');
      const iki = m.ben && m.ben.iki_adim;
      return uyariKarti()
        + '<div class="hesap-kimlik">' + avatar(k.g, k.k, 76)
        + '<p class="hesap-kimlik__ad">' + kac(k.g) + '</p>'
        + '<p class="hesap-kimlik__alt">@' + kac(k.ad) + ' · ' + ROL_AD(k.r) + '</p>'
        + (o.dg && o.dg === bugunGun() ? '<p class="hesap-kimlik__kutla">İyi ki doğdun!</p>' : '')
        /* Kimliğin altında durum hapları: plan ve (açıksa) iki adım. */
        + '<div class="hesap-haplar">'
        + (k.pa ? '<button type="button" class="hesap-hap" data-hesap="sayfa" data-sayfa="plan">'
          + kac(k.pa) + (p && p.etiket ? ' · ' + kac(p.etiket) : '') + '</button>' : '')
        + (iki && iki.acik ? '<button type="button" class="hesap-hap hesap-hap--simge" data-hesap="sayfa" data-sayfa="ikiadim">'
          + ikon('kalkan', 'hesap-ikon') + 'İki adım açık</button>' : '')
        + '</div></div>'
        + '<div class="hesap-sayilar">'
        +   say(uye == null ? null : (uye + 1).toLocaleString('tr-TR'), 'gündür üye')
        +   say(t ? t.n.toLocaleString('tr-TR') : null, 'kayıt')
        +   say(m.cihazlar ? String(m.cihazlar.length) : null, 'cihaz')
        + '</div>'
        + '<ul class="hesap-liste">'
        +   satir({ ikon:'profil', ad:'Profil', sayfa:'profil' })
        +   satir({ ikon:'plan', ad:'Plan', detay:k.pa || '', sayfa:'plan' })
        +   satir({ ikon:'cihazlar', ad:'Cihazlar', detay:m.cihazlar ? String(m.cihazlar.length) : '', sayfa:'cihazlar' })
        +   satir({ ikon:'etkinlik', ad:'Etkinlik', sayfa:'etkinlik', sinif:yanlis ? 'is-dikkat' : '',
              detay:yanlis ? yanlis + ' yanlış deneme' : sonGiris ? sonMetni(sonGiris.zaman) : '' })
        +   satir(Object.assign({ ikon:'guvenlik', ad:'Güvenlik', sayfa:'guvenlik' }, guvenlikKisa(m)))
        + '</ul>'
        + '<ul class="hesap-liste">'
        +   satir({ ikon:'baglanti', ad:'Bağlantılar', detay:baglantiKisa(m), sayfa:'baglantilar' })
        +   satir({ ikon:'esitleme', ad:'Eşitleme', detay:esitKisa(), detayId:'hesap-esit-kisa', sayfa:'esitleme' })
        +   satir({ ikon:'veri', ad:'Verin', detay:t && t.b ? boyut(t.b) : '', sayfa:'verin' })
        + '</ul>'
        + (k.r === 'admin' ? '<ul class="hesap-liste">' + satir({ ikon:'yonetim', ad:'Yönetim',
          detay:m.kullanicilar ? m.kullanicilar.length + ' kişi' : '', sayfa:'yonetim' })
          + satir(yedekSatiri(m)) + '</ul>' : '')
        + '<ul class="hesap-liste">' + satir({ ad:'Çıkış yap', eylem:'cikis', sinif:'is-tehlike' }) + '</ul>';
    },

    profil(m){
      const k = kim(), ku = m.ben && m.ben.kullanici;
      const renkler = ((m.ben && m.ben.renkler) || Object.keys(RENK)).filter(r => RENK[r]);
      const d = new Date(ortam.simdi());
      const bugun = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      /* Kişisel alanlar yalnız sunucunun cevabıyla çizilir (söz 14). */
      const kisisel = ku
        ? '<p class="hesap-bolum hesap-bolum--form">Kişisel bilgiler · isteğe bağlı</p>'
          + alanHtml('hesap-hitap', 'King sana nasıl seslensin', 'text', 'maxlength="30" autocomplete="off" placeholder="'
            + kac(k.g) + '" value="' + kac(ku.hitap || '') + '"')
          + alanHtml('hesap-dogum', 'Doğum günü', 'date', 'min="1900-01-01" max="' + bugun + '" value="' + kac(ku.dogum || '') + '"')
          + alanHtml('hesap-eposta', 'E-posta', 'email', 'maxlength="200" autocomplete="email" value="' + kac(ku.eposta || '') + '"')
          + '<p class="hesap__not hesap__not--form">Hiçbiri bir yere gönderilmez; yalnız bilgisayarındaki LifeOS’ta durur.</p>'
        : '';
      return '<div class="hesap-kimlik hesap-kimlik--kucuk" data-hesap-onizleme>' + avatar(k.g, k.k, 64) + '</div>'
        + '<form class="hesap__form" data-hesap-form="profil" data-ayar-disi>'
        +   alanHtml('hesap-gorunen', 'Görünen ad', 'text', 'maxlength="40" autocomplete="nickname" value="' + kac(k.g) + '"')
        +   '<fieldset class="hesap-renkler"><legend>Renk</legend><div class="hesap-renkler__liste">' + renkler.map(r =>
              '<label class="hesap-renk" style="--renk:' + RENK[r] + '" title="' + kac(RENK_AD[r]) + '">'
              + '<input type="radio" name="hesap-renk" value="' + r + '"' + (r === k.k ? ' checked' : '') + '/>'
              + '<span class="hesap-renk__ad">' + kac(RENK_AD[r]) + '</span></label>').join('') + '</div></fieldset>'
        +   kisisel
        +   formMesaj
        +   '<button type="submit" class="hesap__ana hesap__tam">Kaydet</button>'
        + '</form>'
        + '<dl class="hesap-bilgi">' + bilgi('Kullanıcı adı', '@' + k.ad) + bilgi('Rol', ROL_AD(k.r))
        +   (k.olusturma ? bilgi('Üyelik', tarihMetni(k.olusturma)) : '') + '</dl>';
    },

    /* Plan yalnız görünürlüktür (sunucu sözü 8). Fiyat yok, düğme yok:
       «Yakında» bir etikettir, tıklanacak bir şey değil. */
    plan(m){
      const k = kim(), l = m.ben && m.ben.planlar;
      if(!l) return yukleniyor(m);
      return '<div class="hesap-planlar">' + l.map(p => {
        const simdi = p.id === k.p;
        return '<article class="hesap-plan' + (simdi ? ' is-simdi' : '') + '">'
          + '<header class="hesap-plan__bas"><h3>' + kac(p.ad) + '</h3>'
          + '<span class="hesap-plan__etiket' + (p.durum === 'yakinda' ? ' is-yakinda' : '') + '">' + kac(p.etiket) + '</span></header>'
          + '<p class="hesap-plan__ozet">' + kac(p.ozet) + '</p>'
          + '<ul class="hesap-plan__liste">' + (p.ozellik || []).map(x => '<li>' + ikon('tamam') + '<span>' + kac(x) + '</span></li>').join('') + '</ul>'
          + (simdi ? '<p class="hesap-plan__durum">' + ikon('tamam') + 'Şu anki planın</p>' : '')
          + '</article>';
      }).join('') + '</div>'
      + '<p class="hesap__not">Ödeme yok; hiçbir özellik plana bağlı değil.</p>';
    },

    cihazlar(m){
      const l = m.cihazlar;
      if(!l) return yukleniyor(m);
      const oteki = l.filter(c => !c.bu).length;
      return '<ul class="hesap-liste">' + satir({ ikon:'qr', ad:'Yeni cihaz bağla', alt:'Kodla, şifre yazmadan', sayfa:'bagla' }) + '</ul>'
        + '<ul class="hesap-liste">' + l.map(c =>
          '<li class="hesap-oge">'
          /* Satır ayrıntıyı açar (söz 21): ad, giriş yolu, son adres. */
          + '<button type="button" class="hesap-oge__ac" data-hesap="cihaz" data-id="' + Number(c.id) + '"'
          + ' aria-label="' + kac(c.cihaz_ad + ' — ayrıntı') + '">' + ikon(cihazTuru(c.cihaz_ad), 'hesap-satir__ikon')
          + '<span class="hesap-oge__metin"><b>' + kac(c.cihaz_ad) + '</b><small>'
          + (c.bu ? 'Bu cihaz' : 'Son görülme: ' + kac(sonMetni(c.son))) + '</small></span></button>'
          + (c.bu ? '' : '<button type="button" class="hesap__kucuk" data-hesap="cihaz-cikar" data-id="' + Number(c.id) + '"'
            + ' aria-label="' + kac(c.cihaz_ad + ' oturumunu kapat') + '">Çıkar</button>')
          + '</li>').join('') + '</ul>'
        + (!oteki ? '' : m.onay
          ? '<div class="hesap-onay" role="group" aria-label="Onay"><p>Öteki ' + oteki + ' cihazda oturum kapanır; '
            + 'orada yeniden giriş gerekir. Kayıtlar silinmez.</p><div class="hesap__eylem">'
            + '<button type="button" class="hesap__tehlike" data-hesap="otekiler-evet">Hepsinden çık</button>'
            + '<button type="button" class="hesap__ikinci" data-hesap="otekiler-vazgec">Vazgeç</button></div></div>'
          : '<ul class="hesap-liste">' + satir({ ad:'Öteki cihazların hepsinden çık', eylem:'otekiler', sinif:'is-tehlike' }) + '</ul>')
        + adresNotu();
    },

    /* GÜVENLİK KONTROLÜ önce (kontrol()): her kilit bir satır, dikkat
       isteyen kırmızı yazar; altında şifre ve kurtarma sorusu formları. */
    guvenlik(m){
      const soruVar = m.ben ? m.ben.soru_var : null;
      const l = kontrol(m), n = l.filter(x => x.dikkat).length;
      const ozet = !l.length ? '' : '<div class="hesap-kontrol' + (n ? ' is-dikkat' : '') + '" role="status">'
        + ikon(n ? 'uyari' : 'kalkan', 'hesap-kontrol__ikon')
        + '<div><p class="hesap-kontrol__baslik">' + (n ? (n === 1 ? 'Bir öneri var' : n + ' öneri var') : 'Hesabın iyi korunuyor')
        + '</p><p class="hesap-kontrol__alt">' + (n ? 'Kırmızı satırlara bir bak.' : 'Kontrol listesindeki her şey yolunda.')
        + '</p></div></div>';
      return ozet
        + (l.length ? '<ul class="hesap-liste">' + l.filter(x => x.sayfa).map(x => satir({ ikon:x.ikon, ad:x.ad,
            detay:x.detay, sayfa:x.sayfa, sinif:x.dikkat ? 'is-dikkat' : '' })).join('') + '</ul>' : '')
        + '<div class="hesap-liste hesap-liste--ac">'
        + acilir('parola', 'anahtar', 'Şifreyi değiştir', '',
            '<form class="hesap__form" data-hesap-form="parola" data-ayar-disi>'
            + sifreAlani('hesap-eski', 'Şimdiki şifre', 'current-password')
            + sifreAlani('hesap-yeni', 'Yeni şifre', 'new-password', true)
            + sifreAlani('hesap-yeni2', 'Yeni şifre (tekrar)', 'new-password')
            + CAPS + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Şifreyi değiştir</button></form>')
        + acilir('soru', 'soru', 'Kurtarma sorusu', soruVar === true ? 'Ayarlı' : soruVar === false ? 'Ayarlı değil' : '',
            '<form class="hesap__form" data-hesap-form="soru-ayarla" data-ayar-disi>'
            + alanHtml('hesap-yeni-soru', 'Soru (kendin yaz)', 'text', 'required minlength="4" maxlength="120" autocomplete="off"')
            + alanHtml('hesap-yeni-cevap', 'Cevabın', 'text', CEVAP_EK)
            + sifreAlani('hesap-soru-sifre', 'Şifren', 'current-password')
            + CAPS + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Kaydet</button></form>',
            l.some(x => x.ac === 'soru' && x.dikkat) ? 'is-dikkat' : '')
        + '</div>'
        + '<p class="hesap__not">Şifre değişince öteki cihazlarda yeniden giriş gerekir.</p>';
    },

    /* CİHAZ (söz 21): kendi adı, nasıl girdiği, ne zaman, nereden. Ad
       cihaza bağlıdır; çıkıp yeniden girse de kalır. */
    cihaz(m){
      const c = cihazBul();
      if(!c) return m.cihazlar ? '<p class="hesap__not">Bu cihaz artık listede yok.</p>' : yukleniyor(m);
      return '<div class="hesap-kimlik hesap-kimlik--kucuk"><span class="hesap-cihaz-simge">'
        + ikon(cihazTuru(c.cihaz_ad), 'hesap-ikon') + '</span>'
        + '<p class="hesap-kimlik__alt">' + (c.bu ? 'Bu cihaz' : 'Son görülme: ' + kac(sonMetni(c.son))) + '</p></div>'
        + '<form class="hesap__form" data-hesap-form="cihaz-ad" data-ayar-disi>'
        + alanHtml('hesap-cihaz-ad', 'Cihazın adı', 'text', 'required maxlength="40" autocomplete="off" value="' + kac(c.cihaz_ad) + '"')
        + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Kaydet</button></form>'
        + '<dl class="hesap-bilgi">'
        + bilgi('Giriş', YONTEM_AD[c.yontem] || 'Bilinmiyor')
        + bilgi('İlk giriş', tarihSaat(c.olusturma))
        + bilgi('Son görülme', c.bu ? 'Şimdi' : sonMetni(c.son))
        + bilgi('Son eşitleme', c.esitleme ? sonMetni(c.esitleme) : 'Henüz yok')
        + bilgi('Son adres', adresAd(c.ip) || 'Bilinmiyor')
        + '</dl>'
        + '<ul class="hesap-liste">' + satir({ ad:c.bu ? 'Bu cihazda çıkış yap' : 'Oturumu kapat', eylem:'cihaz-kapat',
          sinif:'is-tehlike' }) + '</ul>'
        + '<p class="hesap__not">' + (c.bu ? 'Kayıtlar bu cihazda kalır; yeniden girince eşitlenir.'
          : 'Oturum kapanınca o cihazda yeniden giriş gerekir; kayıtlar silinmez.') + '</p>';
    },

    /* İKİ ADIMLI DOĞRULAMA (söz 17). Dört hâl: kapalı (şifreyle başlat),
       kurulum (QR + anahtar + kod), yedek kodlar (bir kez), açık. */
    ikiadim(m){
      const d = m.ben && m.ben.iki_adim;
      if(m.yedekler) return yedekHtml(m.yedekler);
      if(m.ikiKurulum){
        const k = m.ikiKurulum, qr = L.QR ? L.QR.svg(k.uri, { etiket:'Doğrulayıcı uygulama için QR kodu' }) : '';
        const tel = /iPhone|iPad|Android/.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
        return adimlar([
          '<b>Doğrulayıcı uygulamayı aç</b><span>Google Authenticator, Microsoft Authenticator ya da iPhone’da Ayarlar › Şifreler. Hepsi ücretsiz.</span>',
          '<b>' + (tel ? 'Ekle' : 'QR kodunu okut') + '</b>'
            + (qr && !tel ? '<div class="hesap-qr">' + qr + '</div>' : '')
            + (tel ? '<a class="hesap__ikinci hesap-adimlar__dugme" href="' + kac(k.uri) + '" target="_blank" rel="noopener">'
              + ikon('kalkan', 'hesap-ikon') + 'Doğrulayıcıda aç</a>' : '')
            + '<span>' + (tel ? 'Açılmazsa uygulamada «anahtarı elle gir» ile bunu yaz:' : 'Okutamıyorsan anahtarı elle yaz:') + '</span>'
            + kopyaKutusu(k.sir.replace(/(.{4})(?=.)/g, '$1 '), 'Anahtarı'),
          '<b>Uygulamadaki kodu yaz</b>'
            + '<form class="hesap__form" data-hesap-form="iki-onayla" data-ayar-disi>' + kodAlani('hesap-iki-kod', 'Kod')
            + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Doğrula ve aç</button></form>',
        ])
        + '<ul class="hesap-liste">' + satir({ ad:'Vazgeç', eylem:'iki-vazgec', sinif:'is-tehlike' }) + '</ul>';
      }
      if(!d) return yukleniyor(m);
      if(!d.acik){
        return tanit('kalkan', 'Şifreye ikinci bir kilit', 'Girişte şifreden sonra telefonundaki doğrulayıcı uygulamanın '
            + '6 haneli kodu sorulur. Şifren başkasına geçse bile hesabın açılmaz.')
          + '<ul class="hesap-liste hesap-liste--duz hesap-uygulamalar">'
          + [['Google Authenticator', 'iPhone ve Android'], ['Microsoft Authenticator', 'iPhone ve Android'],
            ['iPhone Şifreler', 'Ayarlar › Şifreler, iOS 15 ve sonrası']].map(([ad, alt]) =>
            '<li class="hesap-oge">' + ikon('kalkan', 'hesap-satir__ikon') + '<span class="hesap-oge__metin"><b>' + kac(ad)
            + '</b><small>' + kac(alt) + '</small></span><span class="hesap-satir__detay">Ücretsiz</span></li>').join('') + '</ul>'
          + '<form class="hesap__form" data-hesap-form="iki-baslat" data-ayar-disi>'
          + sifreAlani('hesap-iki-sifre', 'Başlamak için şifren', 'current-password') + CAPS + formMesaj
          + '<button type="submit" class="hesap__ana hesap__tam">Kurulumu başlat</button></form>';
      }
      const az = d.yedek_kalan <= 2;
      return '<ul class="hesap-liste hesap-liste--duz">'
        + '<li class="hesap-oge">' + ikon('kalkan', 'hesap-satir__ikon') + '<span class="hesap-oge__metin"><b>Açık</b><small>'
        + (d.olusturma ? sonMetni(d.olusturma) + ' kuruldu' : 'Girişte kod sorulur') + '</small></span></li>'
        + '<li class="hesap-oge' + (az ? ' hesap-olay is-dikkat' : '') + '">' + ikon('anahtar', 'hesap-satir__ikon')
        + '<span class="hesap-oge__metin"><b>Yedek kodlar</b><small>' + d.yedek_kalan + ' kod kaldı'
        + (az ? ' · yenilerini al' : '') + '</small></span></li></ul>'
        + '<div class="hesap-liste hesap-liste--ac">'
        + acilir('yedek', 'anahtar', 'Yeni yedek kodlar', '',
            '<form class="hesap__form" data-hesap-form="yedek-yenile" data-ayar-disi>'
            + sifreAlani('hesap-yedek-sifre', 'Şifren', 'current-password') + CAPS + formMesaj
            + '<p class="hesap__not hesap__not--form">Eski yedek kodlar hemen geçersiz olur.</p>'
            + '<button type="submit" class="hesap__ana hesap__tam">Yeni kodları göster</button></form>')
        + acilir('iki-kapat', 'kalkan', 'İki adımı kapat', '',
            '<form class="hesap__form" data-hesap-form="iki-kapat" data-ayar-disi>'
            + sifreAlani('hesap-kapat-sifre', 'Şifren', 'current-password')
            + alanHtml('hesap-kapat-kod', 'Uygulamadaki kod ya da bir yedek kod', 'text',
              'autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" required minlength="6" maxlength="9"')
            + CAPS + formMesaj + '<button type="submit" class="hesap__tehlike hesap__tam">Kapat</button></form>')
        + '</div>'
        + '<p class="hesap__not">Telefonunu ve yedek kodlarını birlikte kaybedersen: ' + (kim().r === 'admin'
          ? 'bilgisayarda <code>python sistem/hesap.py --iki-adim-kapat ' + kac(kim().ad) + '</code>.'
          : 'admin Yönetim’den kapatır.') + '</p>';
    },

    /* BAĞLANTILAR: ücretsiz uygulamalar, gruplu (iOS Ayarlar gibi). */
    baglantilar(m){
      const oz = (m.ben && m.ben.baglantilar) || {}, iki = m.ben && m.ben.iki_adim;
      return '<p class="hesap-bolum">Takvim</p><ul class="hesap-liste">'
        + satir({ ikon:'takvim', ad:'Takvim aboneliği', alt:'iPhone Takvim, Outlook, Thunderbird',
          detay:m.ben ? (oz.takvim ? 'Açık' : 'Kapalı') : '', sayfa:'takvim' }) + '</ul>'
        + '<p class="hesap-bolum">Kısayollar ve otomasyon</p><ul class="hesap-liste">'
        + satir({ ikon:'kisayol', ad:'Erişim anahtarları', alt:'iPhone Kısayollar, Apple Sağlık, Home Assistant',
          detay:oz.anahtar ? String(oz.anahtar) : '', sayfa:'anahtarlar' })
        + satir({ ikon:'gelen', ad:'Gelen kutusu', alt:'Gelen satırlar SPİ › Onaylar’a düşer',
          detay:oz.gelen_bekleyen ? oz.gelen_bekleyen + ' bekliyor' : '', sayfa:'gelen' }) + '</ul>'
        + '<p class="hesap-bolum">Giriş</p><ul class="hesap-liste">'
        + satir({ ikon:'kalkan', ad:'Doğrulayıcı uygulama', alt:'Google ve Microsoft Authenticator, iPhone Şifreler',
          detay:iki ? (iki.acik ? 'Açık' : 'Kapalı') : '', sayfa:'ikiadim' })
        + satir({ ikon:'qr', ad:'Kodla cihaz bağla', alt:'Tablet ya da telefon şifresiz girer', sayfa:'bagla' }) + '</ul>'
        + '<p class="hesap__not">Hepsi bilgisayarındaki LifeOS’ta çalışır: şirket hesabı, ücret ya da internet gerekmez.</p>';
    },

    /* TAKVİM ABONELİĞİ (sunucu sözü 17). */
    takvim(m){
      const t = m.baglanti && m.baglanti.takvim;
      if(!t) return yukleniyor(m);
      const ays = (t.yayinlar || []).find(y => y.ad === 'ays/takvim');
      const kaynak = '<p class="hesap-bolum">İçinde</p><ul class="hesap-liste hesap-liste--duz"><li class="hesap-oge">'
        + ikon('takvim', 'hesap-satir__ikon') + '<span class="hesap-oge__metin"><b>AYS</b><small>Sınav günleri, istisnalar, hedef son günleri</small></span>'
        + '<span class="hesap-satir__detay">' + (ays ? (ays.adet == null ? '' : ays.adet + ' etkinlik') : 'AYS’yi bir kez aç') + '</span></li></ul>';
      if(!t.acik){
        return tanit('takvim', 'Sınav günlerin takviminde', 'Takvim uygulaman bu adrese abone olur; AYS’de bir tarih '
            + 'değişince takvimin de kendiliğinden güncellenir.')
          + kaynak + '<button type="button" class="hesap__ana hesap__tam" data-hesap="takvim-ac">Aboneliği aç</button>';
      }
      const ev = evAdresleri().map(b => b + t.yol);
      return kaynak
        + '<p class="hesap-bolum">iPhone ve iPad</p>'
        + (ev.length ? '<div class="hesap-kutu">' + kopyaKutusu(ev[0], 'Takvim adresini')
            + adimlar(['Ayarlar › Takvim › Hesaplar › Hesap Ekle › Diğer', '«Abone Olunan Takvim Ekle»ye bu adresi yapıştır'])
            + '<p class="hesap__not">Telefon evdeki Wi-Fi’dayken güncellenir; LifeOS kök sertifikası telefonda kurulu olmalı.</p></div>'
          : '<p class="hesap__not hesap-kutu">Ev ağı kapalı. Bilgisayarda bir kez <code>python sistem/telefon.py</code> çalıştırıp LifeOS’u yeniden başlat.</p>')
        + (pcMi() ? '<p class="hesap-bolum">Bu bilgisayar</p><div class="hesap-kutu">' + kopyaKutusu(PC_KOK + t.yol, 'Takvim adresini')
            + '<p class="hesap__not">Thunderbird ya da klasik Outlook’ta «İnternet takvimi ekle».</p></div>' : '')
        + '<p class="hesap-bolum">Google Takvim</p><div class="hesap-kutu"><p class="hesap__not hesap__not--ilk">Google adresi '
        + 'internetten çeker; evdeki bilgisayarına ulaşamaz. Dosyayı indirip Google Takvim’de «İçe aktar»la bir kez ekleyebilirsin.</p>'
        + '<button type="button" class="hesap__ikinci" data-hesap="takvim-indir">' + ikon('indir', 'hesap-ikon') + 'Dosyayı indir (.ics)</button></div>'
        + (m.takvimOnay
          ? '<div class="hesap-onay"><p>Eski adres hemen çalışmaz; takvim uygulamalarına yenisini eklemen gerekir.</p>'
            + '<div class="hesap__eylem"><button type="button" class="hesap__tehlike" data-hesap="takvim-yenile">Adresi yenile</button>'
            + '<button type="button" class="hesap__ikinci" data-hesap="takvim-vazgec">Vazgeç</button></div></div>'
          : '<ul class="hesap-liste">' + satir({ ikon:'yenile', ad:'Adresi yenile', eylem:'takvim-yenile-sor' }) + '</ul>'
            + '<ul class="hesap-liste">' + satir({ ad:'Aboneliği kapat', eylem:'takvim-kapat', sinif:'is-tehlike' }) + '</ul>')
        + '<p class="hesap__not">' + (t.son ? 'Takvim en son ' + sonMetni(t.son) + ' baktı.' : 'Henüz hiçbir takvim bakmadı.')
        + ' Adres bir anahtardır: yalnız kendi cihazlarına ekle.</p>';
    },

    /* KISAYOLLAR VE OTOMASYON (sunucu sözü 16, söz 19). */
    anahtarlar(m){
      const b = m.baglanti;
      if(!b) return yukleniyor(m);
      const y = m.yeniAnahtar, t = tarifIstek(m);
      const l = b.anahtarlar || [];
      return (y ? '<div class="hesap-yeni" role="status"><p>' + ikon('tamam') + '<span><b>«' + kac(y.ad) + '» hazır.</b> '
            + 'Şimdi kopyala; bir daha gösterilmez.</span></p>'
            + kopyaKutusu(y.anahtar, 'Anahtarı') + '</div>' : '')
        + (l.length ? '<ul class="hesap-liste">' + l.map(x => '<li class="hesap-oge">' + ikon('kisayol', 'hesap-satir__ikon')
            + '<span class="hesap-oge__metin"><b>' + kac(x.ad) + '</b><small>' + kac(x.on_ek) + '… · '
            + (String(x.yetki || '').split(',').indexOf('oku') >= 0 ? 'özeti de okur · ' : '')
            + (x.son ? 'son kullanım ' + kac(sonMetni(x.son)) : 'hiç kullanılmadı') + '</small></span>'
            + '<button type="button" class="hesap__kucuk" data-hesap="anahtar-sil" data-id="' + Number(x.id) + '"'
            + ' aria-label="' + kac('«' + x.ad + '» anahtarını sil') + '">Sil</button></li>').join('') + '</ul>'
          : (y ? '' : tanit('kisayol', 'Telefonundan tek satır', 'iPhone Kısayollar, Android ya da Home Assistant tek satır '
            + 'gönderir: SPİ’ye «su 250», AYS’ye «paragraf 20», ESP’ye «30 dk gitar». O sistem satırı Onaylar’a bırakır, '
            + 'sen onaylayınca yazılır.')))
        + '<div class="hesap-liste hesap-liste--ac">' + acilir('anahtar-ekle', 'ekle', 'Anahtar oluştur', '',
            '<form class="hesap__form" data-hesap-form="anahtar" data-ayar-disi>'
            + alanHtml('hesap-anahtar-ad', 'Ad', 'text', 'required maxlength="40" autocomplete="off" placeholder="iPhone Kısayollar"')
            + '<label class="hesap__secim" for="hesap-anahtar-oku"><input type="checkbox" id="hesap-anahtar-oku">'
            + '<span>Günün özetini de okuyabilsin<small>Siri: «Bugün ne var?» — AYS, SPİ ve ESP’nin bugün cümlesi</small></span></label>'
            + sifreAlani('hesap-anahtar-sifre', 'Şifren', 'current-password') + CAPS + formMesaj
            + '<button type="submit" class="hesap__ana hesap__tam">Oluştur</button></form>') + '</div>'
        + '<p class="hesap-bolum">Tarifler</p><div class="hesap-liste hesap-liste--ac">'
        + acilir('t-istek', 'baglanti', 'İstek', '', '<p class="hesap__not hesap__not--ilk">Her tarif bu tek isteği gönderir.'
            + (t.a === 'lifeos_…' ? ' Anahtar oluşturunca burada görünür.' : '') + '</p>' + istekKutusu(t)
            + (pcMi() ? '<p class="hesap__not">Bu bilgisayardaki bir uygulama için adres: <code>' + kac(t.pc) + '</code></p>' : ''))
        + acilir('t-ios', 'telefon', 'iPhone Kısayollar', '', adimlar([
            'Kısayollar’da yeni kısayol › «Girdi İste» (Ask for Input) ekle.',
            '«URL’nin İçeriğini Al» (Get Contents of URL) ekle; adres, POST, başlık ve gövde yukarıdaki «İstek»teki gibi; «metin» alanına «Sağlanan Girdi»yi koy.',
            'Adını «LifeOS’a yaz» koy. Siri’ye «LifeOS’a yaz» deyip «su 250» söyle.']))
        + acilir('t-siri', 'telefon', 'Siri: «Bugün ne var?»', '', adimlar([
            'Anahtarı «Günün özetini de okuyabilsin» seçerek oluştur.',
            'Kısayollar’da yeni kısayol › «URL’nin İçeriğini Al»: adres <code>' + kac(t.url.replace(/\/gelen$/, '/ozet.txt')) + '</code>, '
              + 'yöntem GET, başlık <code>Authorization</code> = <code>Bearer ' + kac(t.a) + '</code>.',
            '«Metni Konuş» (Speak Text) ekle; girdi önceki adımın sonucu.',
            'Adını «Bugün ne var» koy. Siri’ye «Bugün ne var» de.'])
          + '<p class="hesap__not">Özeti her sistem kendi kuralıyla yazar. Bugün hiç açılmamış bir sistemin dünkü sayısı '
          + 'bugünmüş gibi okunmaz: «bugün henüz açılmadı» denir.</p>')
        + acilir('t-modul', 'baglanti', 'AYS ve ESP’ye', '', adimlar([
            'Aynı istek; gövdeye <code>"modul"</code> ekle: <code>{"metin": "paragraf 20", "modul": "ays"}</code>.',
            'AYS anlar: <code>soru 40 matematik</code>, <code>2 saat fizik</code>, <code>paragraf 20</code>, <code>uyku 7</code>.',
            'ESP anlar: <code>30 dk gitar</code>, <code>45 dakika felsefe okudum</code>, <code>20 dk diksiyon</code>.',
            'Kısayollar’da her sistem için ayrı kısayol aç: «AYS’ye yaz», «ESP’ye yaz».'])
          + '<p class="hesap__not">Her satırı yalnız kendi sistemi alır; o gün o dersin bloğu yoksa ya da süre yazılmadıysa '
          + 'satır «anlaşılmadı» diye nedeniyle döner, uydurulmaz.</p>')
        + acilir('t-saglik', 'kalp', 'Apple Sağlık’tan her sabah', '', adimlar([
            'Kısayollar › Otomasyon › Günün Saati (ör. 08:00) › Hemen Çalıştır.',
            '«Sağlık Örneklerini Bul» (Find Health Samples): Kilo, son 1 gün, en yeni 1 örnek.',
            '«Metin»: <code>kilo</code> ve bulunan değer; sonra «URL’nin İçeriğini Al» ile gönder.',
            'Uyku için «Uyku Analizi»nin süresi toplanır; SPİ <code>uyku 7,2</code> gibi saat bekler.'])
          + '<p class="hesap__not">Gelenler SPİ › Onaylar’da bekler; tek dokunuşla kaydedersin. Ölçüm onaysız yazılmaz.</p>')
        + acilir('t-android', 'telefon', 'Android: HTTP Shortcuts', '', adimlar([
            'Ücretsiz «HTTP Shortcuts» uygulamasında yeni kısayol › Normal.',
            'Yöntem POST, adres yukarıdaki; Başlıklar’a <code>Authorization</code> = <code>Bearer ' + kac(t.a) + '</code>.',
            'Gövde: Özel metin, tür <code>application/json</code>, içerik <code>{"metin": "{metin}"}</code>; «metin»i soran bir değişken ekle.']))
        + acilir('t-ha', 'ev', 'Home Assistant', '', '<pre class="hesap-kod-blok"><code>' + kac('rest_command:\n  lifeos_yaz:\n'
            + '    url: "' + t.url + '"\n    method: POST\n    headers:\n      Authorization: "Bearer ' + t.a + '"\n'
            + '    content_type: "application/json"\n    payload: \'{"metin": "{{ metin }}"}\'\n') + '</code></pre>'
            + '<p class="hesap__not">Home Assistant LifeOS kök sertifikasını tanımazsa sertifikayı ona ekle.</p>')
        + '</div>'
        + '<p class="hesap__not">Anahtar yalnız satır bırakır; verini okuyamaz, hesabına giremez. Kaybolursa sil, yenisini aç.</p>';
    },

    /* GELEN KUTUSU: dışarıdan gelen satırlar ve SPİ'nin onlarla ne yaptığı. */
    gelen(m){
      const l = m.baglanti && m.baglanti.gelen;
      if(!l) return yukleniyor(m);
      if(!l.length){
        return tanit('gelen', 'Henüz bir satır gelmedi', 'Kısayol ya da otomasyon bir satır gönderince burada görünür.')
          + '<ul class="hesap-liste">' + satir({ ikon:'kisayol', ad:'Kısayollar ve otomasyon', sayfa:'anahtarlar' }) + '</ul>';
      }
      /* Satırı yalnız kendi sistemi alır (sunucu GELEN_MODULLER). */
      const DURUM = { bekliyor:['etkinlik', ' açılınca işlenir'], onayda:['tamam', ' › Onaylar’da'],
        anlasilmadi:['uyari', 'Anlaşılmadı'] };
      let gun = '', html = '';
      l.forEach(o => {
        const g = gunBasligi(o.zaman);
        if(g !== gun){
          if(gun) html += '</ul>';
          html += '<p class="hesap-bolum">' + kac(g) + '</p><ul class="hesap-liste">';
          gun = g;
        }
        const d = DURUM[o.durum] || DURUM.bekliyor, mod = MODUL_AD[o.modul] || 'SPİ';
        const ne = o.sonuc || (o.durum === 'anlasilmadi' ? d[1] : mod + d[1]);
        html += '<li class="hesap-oge hesap-olay' + (o.durum === 'anlasilmadi' ? ' is-dikkat' : '') + '">' + ikon(d[0], 'hesap-satir__ikon')
          + '<span class="hesap-oge__metin"><b>' + kac(o.metin) + '</b><small>' + kac([o.kaynak, ne].filter(Boolean).join(' · '))
          + '</small></span><span class="hesap-satir__detay">' + saatMetni(o.zaman) + '</span></li>';
      });
      return html + '</ul><p class="hesap__not">Son ' + l.length + ' satır. Ölçüm, sen Onaylar’da kaydedene dek yazılmaz.</p>';
    },

    /* YENİ CİHAZ BAĞLA (söz 18): altı haneli kod, QR, geri sayım. */
    bagla(m){
      const b = m.bag;
      if(!b) return yukleniyor(m);
      if(b.durum === 'baglandi'){
        return tanit('tamam', (b.cihaz_ad || 'Cihaz') + ' bağlandı', 'Girdi; kayıtlar ilk eşitlemeyle iner.')
          + '<button type="button" class="hesap__ana hesap__tam" data-hesap="geri">Tamam</button>';
      }
      if(b.durum === 'bitti'){
        return tanit('etkinlik', 'Kodun süresi doldu', 'Güvenlik için kod 5 dakika geçerli.')
          + '<button type="button" class="hesap__ana hesap__tam" data-hesap="bag-yeni">Yeni kod</button>';
      }
      const ev = evAdresleri()[0];
      const adres = ev ? ev + '/?bagla=' + b.kod : '';
      const qr = adres && L.QR && !ortam.yerelUygulama() ? L.QR.svg(adres, { etiket:'Tabletin kamerasıyla okutulacak bağlama kodu' }) : '';
      return '<div class="hesap-bag">'
        + '<p class="hesap-bag__kod" aria-label="' + kac('Bağlama kodu ' + b.kod.split('').join(' ')) + '">'
        + kac(b.kod.slice(0, 3)) + '<span></span>' + kac(b.kod.slice(3)) + '</p>'
        + '<p class="hesap-bag__sure" data-hesap-sure>' + kac(kalanMetni(b.bitis)) + '</p>'
        + (qr ? '<div class="hesap-qr hesap-qr--kucuk">' + qr + '</div>' : '') + '</div>'
        + adimlar(['Yeni cihazda LifeOS’u aç', '«Kodla bağlan»a dokun ve bu kodu yaz'
          + (qr ? '<span>Tablette kamerayla QR’ı okutmak da olur.</span>' : '')])
        + '<ul class="hesap-liste">' + satir({ ad:'Vazgeç', eylem:'bag-vazgec', sinif:'is-tehlike' }) + '</ul>'
        + '<p class="hesap__not">Kod tek kullanımlık; bağlanan cihaz Cihazlar’da görünür, oradan çıkarılabilir.</p>';
    },

    esitleme(m){
      const modulde = !!(ayar && ayar.depo);
      const ay = m.ben && m.ben.ayrinti;
      const sayi = { ays:{ n:0, b:0, son:0 }, spi:{ n:0, b:0, son:0 }, esp:{ n:0, b:0, son:0 } };
      if(ay) Object.keys(ay).forEach(a => {
        const k = a.split('/')[0];
        if(!(k in sayi)) return;
        sayi[k].n += Number(ay[a].n) || 0; sayi[k].b += Number(ay[a].bayt) || 0;
        sayi[k].son = Math.max(sayi[k].son, Number(ay[a].son) || 0);
      });
      return (modulde
          ? '<div class="hesap-esit"><p class="hesap__durum is-' + kac(hal.durum) + '" id="hesap-durum" role="status" aria-live="polite">'
            + kac(durumMetni()) + '</p><button type="button" class="hesap__ana" data-hesap="esitle">Şimdi eşitle</button></div>'
          : '')
        + (ay ? '<p class="hesap-bolum">Bilgisayardaki kopya</p><ul class="hesap-liste hesap-liste--duz">' + ['ays', 'spi', 'esp'].map(k =>
            '<li class="hesap-oge"><span class="hesap-oge__metin"><b>' + MODUL_AD[k] + '</b><small>'
            + (sayi[k].n ? sayi[k].n.toLocaleString('tr-TR') + ' kayıt · ' + boyut(sayi[k].b) : 'kayıt yok') + '</small></span>'
            + (sayi[k].son ? '<span class="hesap-satir__detay">' + kac(sonMetni(sayi[k].son)) + '</span>' : '') + '</li>').join('')
            + '</ul>' : yukleniyor(m))
        + (m.cihazlar && m.cihazlar.length ? '<p class="hesap-bolum">Cihazların son eşitlemesi</p><ul class="hesap-liste">'
            + m.cihazlar.map(c => '<li class="hesap-oge">' + ikon(cihazTuru(c.cihaz_ad), 'hesap-satir__ikon')
              + '<span class="hesap-oge__metin"><b>' + kac(c.cihaz_ad) + '</b><small>' + (c.bu ? 'Bu cihaz' : 'Cihaz') + '</small></span>'
              + '<span class="hesap-satir__detay">' + (c.esitleme ? kac(sonMetni(c.esitleme)) : 'henüz yok') + '</span></li>').join('')
            + '</ul>' : '')
        + '<p class="hesap__not">Bu cihaz: ' + kac(cihazAdi()) + '. Kayıtlar bilgisayardaki LifeOS ile eşitlenir; '
        + 'fotoğraflar çekildiği cihazda kalır.' + (modulde ? '' : ' Eşitleme her sistemin içinde kendiliğinden olur.') + '</p>';
    },

    yonetim(m){
      const l = m.kullanicilar;
      const kayit = typeof m.kayit === 'boolean' ? m.kayit : !(sunucu && sunucu.kayit === false);
      return '<ul class="hesap-liste hesap-liste--duz"><li class="hesap-oge">'
        + '<span class="hesap-oge__metin"><b id="hesap-kayit-ad">Yeni hesap açılabilir</b><small>'
        + (kayit ? 'Herkes kendi hesabını açar.' : 'Kapalı: hesabı sen eklersin.') + '</small></span>'
        + '<button type="button" class="hesap-anahtar" role="switch" aria-checked="' + (kayit ? 'true' : 'false') + '"'
        + ' aria-labelledby="hesap-kayit-ad" data-hesap="kayit-ayar"></button></li></ul>'
        + (l ? '<p class="hesap-bolum">Kullanıcılar</p><ul class="hesap-liste">' + l.map(u =>
            '<li><button type="button" class="hesap-satir hesap-satir--kisi" data-hesap="kisi" data-id="' + Number(u.id) + '">'
            + avatar(u.gorunen_ad, u.renk, 34)
            + '<span class="hesap-oge__metin"><b>' + kac(u.gorunen_ad) + '</b><small>@' + kac(u.ad) + ' · ' + ROL_AD(u.rol)
            + ' · ' + kac(u.plan_ad) + '</small></span>' + ikon('ileri', 'hesap-satir__ok') + '</button></li>').join('') + '</ul>'
          : yukleniyor(m))
        + '<div class="hesap-liste hesap-liste--ac">' + acilir('ekle', 'ekle', 'Kullanıcı ekle', '',
            '<form class="hesap__form" data-hesap-form="kullanici-ekle" data-ayar-disi>'
            + alanHtml('hesap-yeni-ad', 'Kullanıcı adı', 'text', 'autocomplete="off" ' + AD_EK)
            + sifreAlani('hesap-yeni-sifre', 'Geçici şifre', 'new-password', true)
            + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Ekle</button></form>') + '</div>';
    },

    etkinlik(m){
      const l = m.etkinlik;
      if(!l) return yukleniyor(m);
      if(!l.length) return '<p class="hesap__not">Henüz kayıtlı etkinlik yok.</p>';
      const yanlis = yanlisSayisi(l);
      let gun = '', html = '';
      l.forEach(o => {
        const g = gunBasligi(o.zaman);
        if(g !== gun){
          if(gun) html += '</ul>';
          html += '<p class="hesap-bolum">' + kac(g) + '</p><ul class="hesap-liste">';
          gun = g;
        }
        const t = OLAY[o.tur] || ['etkinlik', o.tur];
        const alt = (o.tur === 'cihaz' ? [o.ayrinti, o.cihaz_ad ? 'ile: ' + o.cihaz_ad : ''] :
          o.tur === 'otekiler' ? [o.ayrinti + ' cihaz', o.cihaz_ad] :
          o.tur === 'yonetim' ? [o.ayrinti] : [o.cihaz_ad, o.ip, o.ayrinti]).filter(Boolean).join(' · ');
        html += '<li class="hesap-oge hesap-olay' + (YANLIS[o.tur] ? ' is-dikkat' : '') + '">' + ikon(t[0], 'hesap-satir__ikon')
          + '<span class="hesap-oge__metin"><b>' + kac(t[1]) + '</b>' + (alt ? '<small>' + kac(alt) + '</small>' : '') + '</span>'
          + '<span class="hesap-satir__detay">' + saatMetni(o.zaman) + '</span></li>';
      });
      return (yanlis ? '<div class="hesap-uyari" role="status">' + ikon('uyari') + '<p>Son 7 günde <b>' + yanlis
          + ' yanlış deneme</b>. Sen değilsen şifreni değiştir.</p>'
          + '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="sayfa" data-sayfa="guvenlik">Güvenlik</button></div>' : '')
        + html + '</ul><p class="hesap__not">Son ' + l.length + ' olay. Şifre ve cevaplar deftere hiç yazılmaz.</p>';
    },

    /* VERİN (sunucu sözü 13): indir ya da hesabı sil. Silme geri
       alınamaz: önce ne gideceği ve ne kalacağı yazılır, şifre sorulur. */
    verin(m){
      const t = toplam(m), n = m.cihazlar ? m.cihazlar.length : null;
      const yd = m.ben && m.ben.yedek, admin = kim().r === 'admin';
      const yedekMetni = yd ? 'Her gün kendiliğinden · ' + (yd.son ? 'son: ' + sonMetni(yd.son) : 'ilk yedek bugün alınır') : '';
      return (yd ? '<ul class="hesap-liste">' + (admin
          ? satir({ ikon:'yedek', ad:'Bilgisayardaki yedek', detay:yd.son ? sonMetni(yd.son) : '', sayfa:'yedek' })
          : '<li class="hesap-oge">' + ikon('yedek', 'hesap-satir__ikon') + '<span class="hesap-oge__metin"><b>Bilgisayardaki yedek</b><small>'
            + kac(yedekMetni) + '</small></span></li>') + '</ul>' : '')
        + '<ul class="hesap-liste"><li class="hesap-oge">' + ikon('indir', 'hesap-satir__ikon')
        + '<span class="hesap-oge__metin"><b>Verimi indir</b><small>Bilgisayardaki kopyanın tamamı'
        + (t ? ' · ' + t.n.toLocaleString('tr-TR') + ' kayıt' + (t.b ? ' · ' + boyut(t.b) : '') : '') + ' · tek JSON dosyası</small></span>'
        + '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="indir">İndir</button></li></ul>'
        + (!m.silOnay
          ? '<ul class="hesap-liste">' + satir({ ad:'Hesabı sil', eylem:'sil-ac', sinif:'is-tehlike' }) + '</ul>'
          : '<div class="hesap-onay"><p><b>Hesabın kalıcı olarak silinir.</b> Geri alınamaz.</p>'
            + '<ul class="hesap-onay__liste">'
            + '<li>Silinir: bilgisayardaki kopya' + (t ? ' (' + t.n.toLocaleString('tr-TR') + ' kayıt)' : '') + ', '
            + (n == null ? 'oturumlar' : n + ' cihazdaki oturum') + ', etkinlik ve kişisel bilgiler.</li>'
            + '<li>Kalır: her cihazdaki veri, o cihazın kendi deposunda.</li></ul>'
            + '<form class="hesap__form" data-hesap-form="sil" data-ayar-disi>'
            + sifreAlani('hesap-sil-sifre', 'Onay için şifren', 'current-password') + CAPS + formMesaj
            + '<div class="hesap__eylem"><button type="submit" class="hesap__tehlike">Hesabı kalıcı olarak sil</button>'
            + '<button type="button" class="hesap__ikinci" data-hesap="sil-vazgec">Vazgeç</button></div></form></div>')
        + '<p class="hesap__not">İstersen önce indir. Her sistemin kendi yedeği de o sistemin Ayarlar’ında durur.</p>';
    },

    /* YEDEKLER (sunucu sözü 20, admin): son yedek, ikinci yer, liste.
       Geri yükleme büyük aksiyondur: önizleme, şifre, önce şimdiki hâlin
       yedeği; ikinci yer ve geri yükleme yalnız bilgisayarın kendisinden. */
    yedek(m){
      const v = m.yedek;
      if(!v) return yukleniyor(m);
      const l = v.yedekler || [], son = l[0], ik = v.ikinci || {}, pc = !!v.yerel;
      const ind = m.indirOnay;
      if(ind){
        return '<div class="hesap-onay hesap-onay--notr"><p><b>' + kac(tarihSaat(ind.zaman)) + ' yedeğini indir</b></p>'
          + '<ul class="hesap-onay__liste"><li>Dosya bütün hesapları, şifre özetlerini ve iki adım sırlarını taşır; '
          + 'güvendiğin bir yerde sakla (şifreli disk, kendi bulutun).</li>'
          + '<li>Geri yüklemek için bu sayfadaki «Dosyadan yükle»yi kullan.</li></ul>'
          + '<form class="hesap__form" data-hesap-form="kopya-indir" data-ayar-disi>'
          + sifreAlani('hesap-indir-sifre', 'Onay için şifren', 'current-password') + CAPS + formMesaj
          + '<div class="hesap__eylem"><button type="submit" class="hesap__ana">İndir</button>'
          + '<button type="button" class="hesap__ikinci" data-hesap="kopya-indir-vazgec">Vazgeç</button></div></form></div>';
      }
      const g = m.geriOnay;
      if(g){
        const sayi = (x, ad) => Number(x || 0).toLocaleString('tr-TR') + ' ' + ad;
        return '<div class="hesap-onay"><p><b>Hesap deposu ' + kac(tarihSaat(g.zaman)) + ' hâline döner.</b></p>'
          + '<ul class="hesap-onay__liste">'
          + '<li>Yedekte ' + sayi(g.yedek.kullanici, 'kullanıcı') + ', ' + sayi(g.yedek.kayit, 'kayıt') + '; şimdi '
          +   sayi(g.simdi.kullanici, 'kullanıcı') + ', ' + sayi(g.simdi.kayit, 'kayıt') + '.</li>'
          + '<li>Önce şimdiki hâlin yedeği alınır; istersen ona geri dönersin.</li>'
          + '<li>Bütün cihazlar (bu cihaz da) yeniden giriş yapar. Yedekten sonra değişen şifre ve ayarlar eski hâline döner.</li>'
          + '<li>Cihazlardaki kayıtlar silinmez: yedekten sonraki değişiklikler eşitlemeyle geri gelir. '
          +   'Yedekten sonra silinen bir kayıt geri gelebilir.</li></ul>'
          + '<form class="hesap__form" data-hesap-form="geri-yukle" data-ayar-disi>'
          + sifreAlani('hesap-geri-sifre', 'Onay için şifren', 'current-password') + CAPS + formMesaj
          + '<div class="hesap__eylem"><button type="submit" class="hesap__tehlike">Geri yükle</button>'
          + '<button type="button" class="hesap__ikinci" data-hesap="geri-vazgec">Vazgeç</button></div></form></div>';
      }
      const TUR = { gunluk:'Günlük', elle:'Elle alındı', once:'Geri yüklemeden önce', dis:'Dosyadan yüklendi' };
      const ikinciAlt = !ik.acik ? 'Kapalı · başka bir disk ya da USB seç'
        : ik.hata ? ik.hata : (ik.son ? 'Son kopya ' + sonMetni(ik.son) : 'Henüz kopya yok') + (ik.yol ? ' · ' + ik.yol : '');
      return '<ul class="hesap-liste hesap-liste--duz">'
        + '<li class="hesap-oge' + (v.hata ? ' is-dikkat' : '') + '">' + ikon('yedek', 'hesap-satir__ikon')
        +   '<span class="hesap-oge__metin"><b>' + (son ? 'Son yedek' : 'Henüz yedek yok') + '</b><small>'
        +   kac(v.hata || ((son ? sonMetni(son.zaman) + ' · ' : '') + 'her gün kendiliğinden, son ' + v.saklama.gunluk + ' gün')) + '</small></span>'
        +   '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="yedekle">Şimdi yedekle</button></li>'
        + '<li class="hesap-oge' + (ik.acik && ik.hata ? ' is-dikkat' : '') + '">' + ikon('disk', 'hesap-satir__ikon')
        +   '<span class="hesap-oge__metin"><b>İkinci yer</b><small>' + kac(ikinciAlt) + '</small></span>'
        +   (ik.acik && pc ? '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="ikinci-kapat">Kapat</button>' : '')
        + '</li></ul>'
        + (ik.ayni_disk ? '<p class="hesap__not">İkinci yer asıl yedekle aynı diskte: disk bozulursa ikisi birden gider.</p>' : '')
        + (pc ? '<div class="hesap-liste hesap-liste--ac">' + acilir('ikinci', 'disk', ik.acik ? 'İkinci yeri değiştir' : 'İkinci yeri ayarla', '',
            '<form class="hesap__form" data-hesap-form="yedek-ikinci" data-ayar-disi>'
            + alanHtml('hesap-ikinci', 'Klasör (örnek: E:\\LifeOS-yedek)', 'text', 'autocomplete="off" spellcheck="false" maxlength="260" required'
              + (ik.yol ? ' value="' + kac(ik.yol) + '"' : ''))
            + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Kaydet ve kopyala</button>'
            + '<p class="hesap__not">Her yedek oraya da yazılır; son ' + 7 + ' kopya kalır. Bilgisayarın diski bozulursa geri dönüş buradan.</p>'
            + '</form>')
          + acilir('kopya-yukle', 'yedek', 'Dosyadan yükle', '',
            '<form class="hesap__form" data-hesap-form="kopya-yukle" data-ayar-disi>'
            + '<label class="hesap__alan" for="hesap-yedek-dosya"><span>Yedek dosyası (.db)</span>'
            + '<input id="hesap-yedek-dosya" type="file" accept=".db,application/octet-stream" required/></label>'
            + formMesaj + '<button type="submit" class="hesap__ana hesap__tam">Yükle</button>'
            + '<p class="hesap__not">Dosya önce denetlenir; bozuksa ya da LifeOS yedeği değilse alınmaz. Yüklenen yedek listeye '
            + 'girer; geri yüklemek için yanındaki «Geri yükle…».</p></form>') + '</div>' : '')
        + (l.length ? '<p class="hesap-bolum">Yedekler</p><ul class="hesap-liste">' + l.map(x =>
            '<li class="hesap-oge">' + ikon(x.tur === 'once' ? 'kalkan' : 'yedek', 'hesap-satir__ikon')
            + '<span class="hesap-oge__metin"><b>' + kac(tarihSaat(x.zaman)) + '</b><small>' + kac(TUR[x.tur] || x.tur) + ' · ' + boyut(x.bayt) + '</small></span>'
            + (pc ? '<span class="hesap-oge__eylem"><button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="kopya-indir-sor"'
              + ' data-ad="' + kac(x.ad) + '" aria-label="' + kac(tarihSaat(x.zaman) + ' yedeğini indir') + '">' + ikon('indir', 'hesap-ikon') + '</button>'
              + '<button type="button" class="hesap__kucuk hesap__kucuk--duz" data-hesap="geri-sor" data-ad="' + kac(x.ad) + '">Geri yükle…</button></span>' : '')
            + '</li>').join('') + '</ul>' : '')
        + '<p class="hesap__not">' + (pc
          ? 'Yedekler bu bilgisayarda: ' + kac(v.klasor) + '. Sunucu açılamazsa: python sistem/hesap.py --geri-yukle.'
          : 'İkinci yer ve geri yükleme yalnız bilgisayarın kendisinden yapılır.') + '</p>';
    },

    kisi(m){
      const u = kisiBul();
      if(!u) return yukleniyor(m);
      const planlar = (m.ben && m.ben.planlar) || [];
      const seg = (alan, etiketId, secenek, simdiki) => '<div class="hesap-seg" role="group" aria-labelledby="' + etiketId + '">'
        + secenek.map(([d, ad]) => '<button type="button" data-hesap="yonet" data-alan="' + alan + '" data-deger="' + kac(d) + '"'
          + ' aria-pressed="' + (d === simdiki ? 'true' : 'false') + '">' + kac(ad) + '</button>').join('') + '</div>';
      return '<div class="hesap-kimlik hesap-kimlik--kucuk">' + avatar(u.gorunen_ad, u.renk, 64)
        + '<p class="hesap-kimlik__alt">@' + kac(u.ad) + '</p></div>'
        + '<div class="hesap-ayar"><p class="hesap-ayar__ad" id="hesap-kisi-rol">Rol</p>'
        +   seg('rol', 'hesap-kisi-rol', [['uye', 'Üye'], ['admin', 'Admin']], u.rol) + '</div>'
        + (planlar.length ? '<div class="hesap-ayar"><p class="hesap-ayar__ad" id="hesap-kisi-plan">Plan</p>'
          + seg('plan', 'hesap-kisi-plan', planlar.map(p => [p.id, p.ad]), u.plan) + '</div>' : '')
        /* Telefonunu ve yedek kodlarını kaybeden üye için (sunucu sözü 14). */
        + (u.iki_adim && u.id !== (m.ben && m.ben.kullanici && m.ben.kullanici.id)
          ? '<ul class="hesap-liste"><li class="hesap-oge">' + ikon('kalkan', 'hesap-satir__ikon')
            + '<span class="hesap-oge__metin"><b>İki adımlı doğrulama açık</b><small>Telefonunu kaybettiyse kapat; sonra yeniden kurar.</small></span>'
            + '<button type="button" class="hesap__kucuk" data-hesap="kisi-iki-kapat">Kapat</button></li></ul>' : '')
        + '<p class="hesap__mesaj" role="alert" hidden data-hesap-kisi-mesaj></p>'
        + '<dl class="hesap-bilgi">' + bilgi('Cihaz', String(u.cihaz || 0)) + bilgi('Son görülme', sonMetni(u.son))
        +   bilgi('Üyelik', tarihMetni(u.olusturma)) + '</dl>';
    },
  };

  function merkezHtml(yon){
    const m = merkez || { yigin:['kok'] };
    const s = sayfa(), y = m.yigin;
    const u = s === 'kisi' ? kisiBul() : null, ch = s === 'cihaz' ? cihazBul() : null;
    const baslik = u ? u.gorunen_ad : ch ? ch.cihaz_ad : SAYFA_AD[s] || SAYFA_AD.kok;
    const onceki = y.length > 1 ? SAYFA_AD[y[y.length - 2]] : '';
    return '<header class="hesap-merkez__ust">'
      + (onceki ? '<button type="button" class="hesap-merkez__geri" data-hesap="geri" aria-label="' + kac(onceki + ' sayfasına dön') + '">'
        + ikon('geri') + '<span>' + kac(onceki) + '</span></button>' : '<span></span>')
      + '<h2 class="hesap-merkez__baslik" id="hesap-merkez-baslik">' + kac(baslik) + '</h2>'
      + '<button type="button" class="hesap-merkez__kapat" data-hesap="merkez-kapat" aria-label="Hesap sayfasını kapat">'
      + ikon('kapat') + '</button></header>'
      + '<div class="hesap-merkez__govde"><div class="hesap-merkez__ic' + (yon ? ' is-' + yon : '') + '">'
      + (m.uyari ? '<p class="hesap__not hesap-merkez__uyari" role="status">' + kac(m.uyari) + '</p>' : '')
      + (m.mesaj ? '<p class="hesap-merkez__mesaj" role="status">' + ikon('tamam') + '<span>' + kac(m.mesaj) + '</span></p>' : '')
      + (SAYFALAR[s] || SAYFALAR.kok)(m) + '</div></div>';
  }

  /* Kullanıcı sayfada yazıyorsa (ya da yazıp kaydetmediyse) gelen veri
     sayfayı yeniden çizmez: yazılan silinmesin (söz 9'un sayfadaki eşi). */
  function merkezKirli(){
    const el = document.querySelector('[data-hesap-merkez]');
    if(!el) return false;
    const a = document.activeElement;
    if(a && el.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'radio') return true;
    return Array.from(el.querySelectorAll('input, textarea')).some(i =>
      i.type === 'radio' || i.type === 'checkbox' ? i.checked !== i.defaultChecked
        : i.type !== 'hidden' && i.value !== i.defaultValue);
  }
  function merkezTazele(yon){
    const kart = typeof document !== 'undefined' && document.querySelector('[data-hesap-merkez] .hesap-merkez__kart');
    if(!kart || !merkez) return;
    const g = kart.querySelector('.hesap-merkez__govde');
    const kay = g && !yon ? g.scrollTop : 0;
    merkez.acik = {};
    kart.querySelectorAll('details[data-hesap-ac]').forEach(d => { if(d.open) merkez.acik[d.getAttribute('data-hesap-ac')] = true; });
    if(yon) merkez.acik = {};
    kart.innerHTML = merkezHtml(yon);
    const g2 = kart.querySelector('.hesap-merkez__govde');
    if(g2) g2.scrollTop = kay;
    if(yon){
      const odak = kart.querySelector('.hesap-merkez__geri') || kart.querySelector('.hesap-merkez__baslik');
      try{ (odak.tagName === 'BUTTON' ? odak : kart).focus({ preventScroll:true }); }catch(e){ /* odaklanamadı */ }
    }
  }

  async function merkezYukle(){
    const m = merkez;
    if(!m) return;
    const isler = [
      ben().then(v => { m.ben = v; if(typeof v.kayit === 'boolean') m.kayit = v.kayit; }),
      cihazlar().then(l => { m.cihazlar = l; }),
      etkinlik().then(l => { m.etkinlik = l; }),
      uyarilar().then(() => null, () => null),          // uyarı yoklaması sayfayı hiç bozmaz
    ];
    if((oturum() || {}).r === 'admin'){
      isler.push(kullanicilar().then(v => { m.kullanicilar = v.kullanicilar || []; m.kayit = v.kayit; }));
    }
    const sonuc = await Promise.all(isler.map(p => p.then(() => null, e => e)));
    if(merkez !== m) return;
    const hata = sonuc.find(Boolean);
    if(hata && hata.kod === 401 && !m.ben) return oturumKapandi();
    m.uyari = !hata ? '' : hata.kod === 0 ? 'Bilgisayara ulaşılamıyor; son bilinen bilgiler gösteriliyor.' : (hata.message || '');
    if(!merkezKirli()) merkezTazele();
  }

  function merkezAc(ilkSayfa){
    if(typeof document === 'undefined' || !document.body || !oturum()) return;
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik(PANEL)) L.KABUK.katmanKapat();
    const once = document.activeElement;
    bagDur();
    merkez = { yigin:['kok'], ben:null, cihazlar:null, kullanicilar:null, etkinlik:null, kayit:null, kisi:null,
      mesaj:'', uyari:'', onay:false, silOnay:false, acik:{}, once,
      baglanti:null, ikiKurulum:null, yedekler:null, yeniAnahtar:null, bag:null, takvimOnay:false, yedek:null, geriOnay:null, indirOnay:null };
    if(ilkSayfa && ilkSayfa !== 'kok' && SAYFA_AD[ilkSayfa]) merkez.yigin.push(ilkSayfa);
    if(!merkezAcikMi()){
      const el = document.createElement('div');
      el.className = 'hesap-merkez';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'hesap-merkez-baslik');
      el.setAttribute('data-hesap-panel', '');
      el.setAttribute('data-hesap-merkez', '');
      el.innerHTML = '<div class="hesap-merkez__kart" tabindex="-1"></div>';
      document.body.appendChild(el);
      document.documentElement.classList.add('hesap-merkez-acik');
    }
    merkezTazele();
    const kart = document.querySelector('[data-hesap-merkez] .hesap-merkez__kart');
    try{ kart.focus({ preventScroll:true }); }catch(e){ /* odaklanamadı */ }
    if(/^(takvim|anahtarlar|gelen|ikiadim|baglantilar|bagla|yedek)$/.test(ilkSayfa || '')) sayfaGir(ilkSayfa);
    return merkezYukle();
  }
  function merkezKapat(){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-hesap-merkez]');
    const once = merkez && merkez.once;
    sayfaCik(merkez ? sayfa() : '');
    bagDur();
    merkez = null;                                  // anahtar, yedek kodlar ve kurulum sırrı bellekten gider (söz 17, 19)
    if(!el) return;
    el.remove();
    document.documentElement.classList.remove('hesap-merkez-acik');
    if(once && once.isConnected && once.focus){ try{ once.focus({ preventScroll:true }); }catch(e){ /* yok */ } }
  }
  function merkezGit(s, ek){
    if(!merkez) return;
    sayfaCik(sayfa());
    Object.assign(merkez, { mesaj:'', onay:false, silOnay:false, takvimOnay:false, geriOnay:null, indirOnay:null }, ek || {});
    merkez.yigin.push(s);
    merkezTazele('ileri');
    sayfaGir(s);
  }
  /* Sayfaya girerken verisi tazelenir (başka cihazdan değişmiş olabilir). */
  function sayfaGir(s){
    if(!merkez) return;
    if(s === 'etkinlik') sayfaVerisi(() => etkinlik().then(l => { merkez.etkinlik = l; }));
    if(s === 'cihazlar' || s === 'cihaz') sayfaVerisi(() => cihazlar().then(l => { merkez.cihazlar = l; }));
    if(s === 'yonetim') sayfaVerisi(() => kullanicilar().then(v => { merkez.kullanicilar = v.kullanicilar || []; merkez.kayit = v.kayit; }));
    if(s === 'yedek') sayfaVerisi(() => yedekDurum().then(v => { merkez.yedek = v; }));
    if(s === 'guvenlik'){
      sayfaVerisi(() => Promise.all([cihazlar(), etkinlik()]).then(([c, e]) => { merkez.cihazlar = c; merkez.etkinlik = e; }));
    }
    if(s === 'takvim' || s === 'anahtarlar' || s === 'gelen' || s === 'ikiadim' || s === 'baglantilar'){
      sayfaVerisi(() => baglantilar().then(v => {
        merkez.baglanti = v;
        if(merkez.ben){
          merkez.ben.iki_adim = v.iki_adim;
          const g = (v.gelen || []).filter(x => x.durum === 'bekliyor').length;
          merkez.ben.baglantilar = { anahtar:(v.anahtarlar || []).length, takvim:!!(v.takvim && v.takvim.acik), gelen_bekleyen:g };
        }
      }));
    }
    if(s === 'bagla') bagBasla();
  }
  /* Sayfadan çıkarken: yeni anahtar, yedek kodlar, yarım kurulum ve açık
     bağlama kodu geride kalmaz (söz 17–19). */
  function sayfaCik(s){
    if(!merkez) return;
    if(s === 'anahtarlar') merkez.yeniAnahtar = null;
    if(s === 'yedek'){ merkez.geriOnay = null; merkez.indirOnay = null; }
    if(s === 'ikiadim'){ merkez.yedekler = null; merkez.ikiKurulum = null; }
    if(s === 'bagla'){
      const b = merkez.bag;
      bagDur();
      merkez.bag = null;
      if(b && b.id && b.durum === 'bekliyor') bagKapat(b.id).catch(() => { /* süresi zaten dolacak */ });
    }
  }
  function merkezGeri(){
    if(!merkez || merkez.yigin.length < 2) return merkezKapat();
    sayfaCik(sayfa());
    merkez.yigin.pop();
    Object.assign(merkez, { mesaj:'', onay:false, silOnay:false, takvimOnay:false, geriOnay:null, indirOnay:null });
    merkezTazele('geri');
  }

  /* KODLA BAĞLAMA (söz 18): kod açılır, saniyede bir geri sayım yalnız o
     yazıyı tazeler (sayfa çizilmez), BAG_YOKLA'da bir «bağlandı mı?». */
  let bagZaman = null, bagSaniye = null;
  function bagDur(){
    if(bagZaman != null){ ortam.iptal(bagZaman); bagZaman = null; }
    if(bagSaniye != null){ clearInterval(bagSaniye); bagSaniye = null; }
  }
  function bagBasla(){
    const m = merkez;
    if(!m) return;
    bagDur();
    m.bag = null;
    merkezTazele();
    bagKoduAc().then(v => {
      if(merkez !== m || sayfa() !== 'bagla') return bagKapat(v.id).catch(() => {});
      m.bag = { kod:v.kod, id:v.id, bitis:v.bitis, durum:'bekliyor' };
      merkezTazele();
      if(typeof setInterval === 'function'){
        bagSaniye = setInterval(() => {
          const el = typeof document !== 'undefined' && document.querySelector('[data-hesap-sure]');
          if(el && m.bag) el.textContent = kalanMetni(m.bag.bitis);
        }, 1000);
      }
      bagYokla(m);
    }, e => {
      if(merkez !== m) return;
      if(e && e.kod === 401) return oturumKapandi();
      m.uyari = e && e.kod === 0 ? baglantiHatasi() : ((e && e.message) || 'Kod açılamadı.');
      merkezTazele();
    });
  }
  function bagYokla(m){
    bagZaman = ortam.zamanla(async () => {
      bagZaman = null;
      if(merkez !== m || !m.bag || sayfa() !== 'bagla') return;
      let v = null;
      try{ v = await bagDurum(m.bag.id); }catch(e){ v = null; }
      if(merkez !== m || !m.bag) return;
      if(v && (v.durum === 'baglandi' || v.durum === 'bitti' || v.durum === 'yok')){
        m.bag.durum = v.durum === 'yok' ? 'bitti' : v.durum;
        m.bag.cihaz_ad = v.cihaz_ad || '';
        bagDur();
        if(v.durum === 'baglandi') cihazlar().then(l => { if(merkez === m) m.cihazlar = l; }, () => {});
        merkezTazele();
        return;
      }
      if(ortam.simdi() > m.bag.bitis + 1000){ m.bag.durum = 'bitti'; bagDur(); merkezTazele(); return; }
      bagYokla(m);
    }, BAG_YOKLA);
  }
  function sayfaVerisi(fn){
    const m = merkez;
    fn().then(() => { if(merkez === m && !merkezKirli()) merkezTazele(); }, e => {
      if(merkez !== m) return;
      if(e && e.kod === 401) return oturumKapandi();
      m.uyari = e && e.kod === 0 ? 'Bilgisayara ulaşılamıyor; son bilinen bilgiler gösteriliyor.' : ((e && e.message) || '');
      if(!merkezKirli()) merkezTazele();
    });
  }
  /* Sayfadaki düğme işi: hata düğmenin yakınına yazılır, sayfa çizilmez. */
  async function merkezIs(fn, hataYeri){
    const m = merkez;
    try{
      const mesaj = await fn();
      if(merkez !== m) return;
      m.mesaj = mesaj || '';
      merkezTazele();
    }catch(e){
      if(merkez !== m) return;
      if(e && e.kod === 401 && /^Oturum/.test(e.message || '')) return oturumKapandi();
      const metin = e && e.kod === 0 ? baglantiHatasi() : (e && e.message) || 'İşlem yapılamadı.';
      const el = hataYeri && document.querySelector(hataYeri);
      if(el){ el.textContent = metin; el.hidden = false; }
      else{ m.mesaj = ''; m.uyari = metin; merkezTazele(); }
    }
  }

  /* ------------------------------------------------------- kısa panel */

  function panelGovde(){
    const o = oturum();
    const mesaj = '<p class="hesap__mesaj" id="hesap-mesaj" role="alert"' + (panelMesaj ? '>' + kac(panelMesaj) : ' hidden>') + '</p>';
    const durumSatiri = '<p class="hesap__durum is-' + kac(hal.durum) + '" id="hesap-durum" role="status" aria-live="polite">'
      + kac(durumMetni()) + '</p>';
    if(!o){
      return durumSatiri
        + (betaMi() ? '<p class="hesap__not">Beta girişindesin: kayıtlar yalnız bu cihazda.</p>' : '')
        + '<p class="hesap__not">Hesap, bilgisayardaki LifeOS üzerinden çalışır. Bu sayfayı LifeOS uygulamasından '
        + '(ya da ev ağındaki https adresinden) aç.</p>';
    }
    return '<button type="button" class="hesap-kisa" data-hesap="merkez" aria-label="' + kac('Hesap ayarları — ' + (o.g || o.a)) + '">'
      + avatar(o.g || o.a, o.k, 40)
      + '<span class="hesap-oge__metin"><b>' + kac(o.g || o.a) + '</b><small>@' + kac(o.a) + (o.pa ? ' · ' + kac(o.pa) : '') + '</small></span>'
      + ikon('ileri', 'hesap-satir__ok') + '</button>'
      + durumSatiri + mesaj
      + '<div class="hesap__eylem">'
      +   '<button type="button" class="hesap__ana" data-hesap="esitle">Şimdi eşitle</button>'
      +   '<button type="button" class="hesap__ikinci" data-hesap="cikis">Çıkış yap</button>'
      + '</div>';
  }

  function panelHtml(){
    return '<div class="katman kmenu kmenu--hesap" role="dialog" aria-label="Hesap ve eşitleme" data-hesap-panel>'
      + '<div class="hesap__bas"><p class="kmenu__bas">Hesap</p>'
      + '<button type="button" class="hesap__kapat" data-katman-kapat aria-label="Hesabı kapat">'
      + ikon('kapat') + '</button></div>'
      + panelGovde() + '</div>';
  }

  const PANEL = 'kabuk-hesap';
  function panelAcik(){ return !!(L.KABUK && L.KABUK.katmanAcik(PANEL)); }
  function panelTazele(){
    if(!panelAcik()) return;
    L.KABUK.katmanTazele(PANEL, panelHtml());
  }
  async function hesapDugmesi(d){
    /* Giriş yoksa ve sunucu varsa düğme doğrudan giriş ekranını açar. */
    if(!oturum()){
      if(!sunucu) await yokla();
      if(sunucu || ortam.yerelUygulama()){ kapiAc(); return; }
    }
    const K = L.KABUK;
    if(!K) return;
    if(K.katmanAcik(PANEL)){ K.katmanKapat(); return; }
    panelMesaj = '';
    K.katmanAc(PANEL, panelHtml(), d);
  }

  /* ------------------------------------------------------- seçim sayfasının çipi

     Modül seçim sayfasında (giriş bir kez orada) sağ üstte: girişliyken
     monogram ve görünen ad (hesap sayfasını açar), değilken «Giriş yap». */
  function cipTazele(){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-hesap-cip]');
    if(!el) return;
    const o = oturum();
    el.hidden = !o && !(sunucu || ortam.yerelUygulama());
    const html = o ? avatar(o.g || o.a, o.k, 28) + '<span>' + kac(o.g || o.a) + '</span>' : '<span>Giriş yap</span>';
    if(el.getAttribute('data-cizim') !== html){
      el.innerHTML = html;
      el.setAttribute('data-cizim', html);
    }
    el.classList.toggle('is-girisli', !!o);
    el.classList.toggle('is-uyari', !!(o && uyari.yeni.length));
    el.setAttribute('aria-label', o ? 'Hesap — ' + (o.g || o.a) + (uyari.yeni.length ? ' · yeni güvenlik olayı' : '') : 'Giriş yap');
  }

  function deger(id){ const e = document.getElementById(id); return e ? e.value : ''; }

  async function formIsle(tur, form){
    const kapida = !!(form.closest && form.closest('[data-hesap-kapi]'));
    const merkezde = !!(form.closest && form.closest('[data-hesap-merkez]'));
    const dugmeEl = form.querySelector('button[type=submit]');
    if(dugmeEl) dugmeEl.disabled = true;
    const adres = () => (document.getElementById('hesap-adres') ? deger('hesap-adres') : null);
    let mesaj = '', ciz = false, hata = false;
    try{
      if(tur === 'giris'){
        const r = await girisYap(deger('hesap-ad').trim(), deger('hesap-parola'), adres());
        if(r && r.iki_adim){
          /* Söz 17: kod adımı; seçili hesap (monogram) kalır, şifre alanı gider. */
          kapi = Object.assign(KAPI_BOS(), { gorunum:'kod', ilk:false, secili:kapi.secili, bilet:r.bilet, adres:r.adres });
          ciz = true;
        }else kapiKapat();
      }else if(tur === 'kod'){
        await girisKod(kapi.bilet, deger('hesap-kod'), kapi.adres);
        kapiKapat();
      }else if(tur === 'bagla'){
        await baglaKod(deger('hesap-kod'), adres());
        kapiKapat();
      }else if(tur === 'iki-baslat'){
        const v = await ikiAdimBaslat(deger('hesap-iki-sifre'));
        if(merkez) merkez.ikiKurulum = { sir:v.sir, uri:v.uri };
      }else if(tur === 'iki-onayla'){
        const y = await ikiAdimOnayla(deger('hesap-iki-kod'));
        if(merkez){
          merkez.ikiKurulum = null;
          merkez.yedekler = y;
          if(merkez.ben) merkez.ben.iki_adim = { acik:true, olusturma:ortam.simdi(), yedek_kalan:y.length };
        }
        mesaj = 'İki adımlı doğrulama açıldı.';
      }else if(tur === 'yedek-yenile'){
        const y = await yedekYenile(deger('hesap-yedek-sifre'));
        if(merkez){
          merkez.yedekler = y;
          if(merkez.ben && merkez.ben.iki_adim) merkez.ben.iki_adim.yedek_kalan = y.length;
        }
      }else if(tur === 'iki-kapat'){
        await ikiAdimKapat(deger('hesap-kapat-sifre'), deger('hesap-kapat-kod'));
        if(merkez && merkez.ben) merkez.ben.iki_adim = { acik:false, olusturma:null, yedek_kalan:0 };
        mesaj = 'İki adımlı doğrulama kapandı.';
      }else if(tur === 'cihaz-ad'){
        const l = await cihazAdlandir(merkez && merkez.cihaz, deger('hesap-cihaz-ad'));
        if(merkez) merkez.cihazlar = l;
        mesaj = 'Cihazın adı kaydedildi.';
      }else if(tur === 'anahtar'){
        const okuEl = document.getElementById('hesap-anahtar-oku');
        const a = await anahtarAc(deger('hesap-anahtar-sifre'), deger('hesap-anahtar-ad'), !!(okuEl && okuEl.checked));
        if(merkez){
          merkez.yeniAnahtar = { anahtar:a.anahtar, ad:a.ad };
          merkez.baglanti = await baglantilar();
        }
      }else if(tur === 'kayit'){
        if(deger('hesap-parola') !== deger('hesap-parola2')) throw new Error('İki şifre aynı değil.');
        await kayitOl(deger('hesap-ad').trim(), deger('hesap-parola'), deger('hesap-soru'), deger('hesap-cevap'), adres());
        kapiKapat();
      }else if(tur === 'soru'){
        kapi.ad = deger('hesap-ad').trim();
        kapi.adres = adres();
        kapi.soru = await soruGetir(kapi.ad, kapi.adres);
        ciz = true;
      }else if(tur === 'kurtar'){
        if(deger('hesap-parola') !== deger('hesap-parola2')) throw new Error('İki şifre aynı değil.');
        const r = await kurtar(kapi.ad, deger('hesap-cevap'), deger('hesap-parola'), kapi.adres);
        if(r && r.iki_adim){
          kapi = Object.assign(KAPI_BOS(), { gorunum:'kod', ilk:false, bilet:r.bilet, adres:r.adres });
          ciz = true;
        }else kapiKapat();
      }else if(tur === 'parola'){
        if(deger('hesap-yeni') !== deger('hesap-yeni2')) throw new Error('İki şifre aynı değil.');
        await parolaDegistir(deger('hesap-eski'), deger('hesap-yeni'));
        mesaj = 'Şifre değişti. Öteki cihazlarda yeniden giriş gerekir.';
      }else if(tur === 'soru-ayarla'){
        await soruAyarla(deger('hesap-soru-sifre'), deger('hesap-yeni-soru'), deger('hesap-yeni-cevap'));
        if(merkez && merkez.ben) merkez.ben.soru_var = true;
        mesaj = 'Kurtarma sorusu kaydedildi.';
      }else if(tur === 'profil'){
        const r = form.querySelector('input[name="hesap-renk"]:checked');
        /* Kişisel alanlar formda yoksa (sunucu cevabı gelmedi) gönderilmez. */
        const ek = document.getElementById('hesap-hitap')
          ? { hitap:deger('hesap-hitap'), dogum:deger('hesap-dogum'), eposta:deger('hesap-eposta') } : {};
        const k = await profilAyarla(deger('hesap-gorunen'), r ? r.value : null, ek);
        if(merkez && merkez.ben) merkez.ben.kullanici = k;
        mesaj = 'Profil kaydedildi.';
      }else if(tur === 'kullanici-ekle'){
        const u = await kullaniciEkle(deger('hesap-yeni-ad').trim(), deger('hesap-yeni-sifre'));
        if(merkez){ const v = await kullanicilar(); merkez.kullanicilar = v.kullanicilar || []; }
        mesaj = '«' + u.ad + '» eklendi. Geçici şifreyi ona sen söyle.';
      }else if(tur === 'sil'){
        await hesabiSil(deger('hesap-sil-sifre'));
        return;                                         // sayfa kapandı, giriş ekranı açık
      }else if(tur === 'geri-yukle'){
        if(!merkez || !merkez.geriOnay) return;
        await geriYukle(merkez.geriOnay.ad, deger('hesap-geri-sifre'));
        return;                                         // oturum kapandı, giriş ekranı açık
      }else if(tur === 'kopya-indir'){
        if(!merkez || !merkez.indirOnay) return;
        const x = await yedekIndir(merkez.indirOnay.ad, deger('hesap-indir-sifre'));
        merkez.indirOnay = null;
        mesaj = x.ad + ' hazır · ' + boyut(x.bayt) + '. Güvendiğin bir yerde sakla.';
      }else if(tur === 'kopya-yukle'){
        const el = document.getElementById('hesap-yedek-dosya');
        const v = await yedekYukle(el && el.files && el.files[0]);
        if(merkez) merkez.yedek = v;
        mesaj = 'Yedek eklendi (' + v.eklenen + '). Geri yüklemek için listeden «Geri yükle…».';
      }else if(tur === 'yedek-ikinci'){
        const v = await yedekAyar(deger('hesap-ikinci').trim());
        if(merkez) merkez.yedek = v;
        if(v.ikinci && v.ikinci.hata) throw new Error(v.ikinci.hata);
        mesaj = 'İkinci yer ayarlandı; son yedek oraya da yazıldı.';
      }
    }catch(e){
      hata = true;
      mesaj = e && e.kod === 0 ? baglantiHatasi() : (e && e.message) || 'İşlem yapılamadı.';
    }finally{
      if(dugmeEl) dugmeEl.disabled = false;
    }
    if(kapida){
      if(ciz && !hata && kapiAcikMi()) kapiTazele('ileri');
      else{
        mesajYaz(mesaj);
        /* Yanlış kod: alan seçili kalır, yenisi üstüne yazılır. */
        const k = hata && document.getElementById('hesap-kod');
        if(k){ try{ k.select(); }catch(e){ /* seçilemedi */ } }
      }
    }else if(merkezde){
      if(hata){
        const el = form.querySelector('.hesap__mesaj');
        if(el){ el.textContent = mesaj; el.hidden = !mesaj; }
      }else if(merkez){
        merkez.mesaj = mesaj;
        merkez.acik = {};
        const kart = document.querySelector('[data-hesap-merkez] .hesap-merkez__kart');
        if(kart) kart.innerHTML = merkezHtml();     // form temizlenir, açılır bölüm kapanır
      }
    }else{
      panelMesaj = mesaj;
      panelTazele();
    }
  }

  /* Seçilen renk ve yazılan ad önizlemede hemen görünür (kaydetmeden). */
  function onizle(form){
    const kap = document.querySelector('[data-hesap-onizleme]');
    if(!kap) return;
    const r = form.querySelector('input[name="hesap-renk"]:checked');
    const ad = deger('hesap-gorunen') || kim().ad;
    kap.innerHTML = avatar(ad, r ? r.value : kim().k, 64);
  }

  function eylem(ad, is){
    if(ad === 'esitle'){
      panelMesaj = '';
      esitle().then(() => { panelTazele(); const k = document.getElementById('hesap-esit-kisa'); if(k) k.textContent = esitKisa(); });
    }else if(ad === 'cikis'){
      panelMesaj = '';
      cikisYap().then(() => {
        merkezKapat();
        if(L.KABUK) L.KABUK.katmanKapat();
        if(kapiGerekli()) kapiAc();
      });
    }else if(ad === 'beta') betaGir();
    else if(ad === 'unuttum') kapiGit('unuttum', { ad:deger('hesap-ad').trim() });
    else if(ad === 'gorunum') kapiGit(is.getAttribute('data-gorunum'));
    else if(ad === 'hatirla'){
      const a = is.getAttribute('data-ad');
      kapiGit('giris', { secili:hatirlananlar().find(x => x.a === a) || null });
    }else if(ad === 'unut'){ unut(is.getAttribute('data-ad')); kapiTazele(); }
    else if(ad === 'goster'){
      const inp = is.parentElement && is.parentElement.querySelector('input');
      if(!inp) return;
      const ac = inp.type === 'password';
      inp.type = ac ? 'text' : 'password';
      is.setAttribute('aria-pressed', ac ? 'true' : 'false');
      is.setAttribute('aria-label', ac ? 'Şifreyi gizle' : 'Şifreyi göster');
    }else if(ad === 'merkez') merkezAc();
    else if(ad === 'merkez-kapat') merkezKapat();
    else if(ad === 'sayfa') merkezGit(is.getAttribute('data-sayfa'));
    else if(ad === 'geri') merkezGeri();
    else if(ad === 'kisi') merkezGit('kisi', { kisi:Number(is.getAttribute('data-id')) });
    else if(ad === 'cihaz-cikar'){
      const id = Number(is.getAttribute('data-id'));
      is.disabled = true;
      merkezIs(async () => {
        await cihazCikar(id);
        if(merkez) merkez.cihazlar = await cihazlar();
        return 'Oturum kapatıldı.';
      });
    }else if(ad === 'otekiler' || ad === 'otekiler-vazgec'){
      if(merkez){ merkez.onay = ad === 'otekiler'; merkez.mesaj = ''; merkezTazele(); }
      const d = merkez && merkez.onay && document.querySelector('[data-hesap="otekiler-evet"]');
      if(d){ try{ d.focus(); }catch(e){ /* yok */ } }
    }else if(ad === 'otekiler-evet'){
      is.disabled = true;
      merkezIs(async () => {
        const n = await otekilerdenCik();
        if(merkez){ merkez.onay = false; merkez.cihazlar = await cihazlar(); }
        return n ? n + ' cihazda oturum kapandı.' : 'Öteki cihaz yoktu.';
      });
    }else if(ad === 'indir'){
      is.disabled = true;
      merkezIs(async () => {
        const v = await disaAktar();
        return v.ad + ' hazır · ' + v.kayit.toLocaleString('tr-TR') + ' kayıt.';
      });
    }else if(ad === 'sil-ac' || ad === 'sil-vazgec'){
      if(!merkez) return;
      merkez.silOnay = ad === 'sil-ac';
      merkez.mesaj = '';
      merkezTazele();
      const f = merkez.silOnay && document.getElementById('hesap-sil-sifre');
      if(f){ try{ f.focus(); }catch(e){ /* yok */ } }
    }else if(ad === 'kayit-ayar'){
      const yeni = is.getAttribute('aria-checked') !== 'true';
      is.disabled = true;
      merkezIs(async () => {
        const v = await kayitAyarla(yeni);
        if(merkez) merkez.kayit = v;
        return v ? 'Yeni hesap açma açık.' : 'Yeni hesap açma kapalı.';
      });
    }else if(ad === 'cihaz'){
      merkezGit('cihaz', { cihaz:Number(is.getAttribute('data-id')) });
    }else if(ad === 'cihaz-kapat'){
      const c = cihazBul();
      if(!c) return;
      is.disabled = true;
      if(c.bu){
        cikisYap().then(() => { merkezKapat(); if(L.KABUK) L.KABUK.katmanKapat(); if(kapiGerekli()) kapiAc(); });
        return;
      }
      merkezIs(async () => {
        await cihazCikar(c.id);
        if(merkez){ merkez.cihazlar = await cihazlar(); merkez.yigin.pop(); merkez.acik = {}; }
        return '«' + c.cihaz_ad + '» oturumu kapatıldı.';
      });
    }else if(ad === 'uyari-gordum'){
      uyariGordum();
      if(merkez) merkezTazele();
    }else if(ad === 'uyari-incele'){
      const oid = Number(is.getAttribute('data-oturum')) || null;
      uyariGordum();
      if(oid && merkez && merkez.cihazlar && merkez.cihazlar.some(c => c.id === oid)) merkezGit('cihaz', { cihaz:oid });
      else merkezGit('etkinlik');
    }else if(ad === 'yedek-kip'){
      kapi.yedekKip = !kapi.yedekKip;
      kapiTazele();
    }else if(ad === 'kopyala'){
      const metin = is.getAttribute('data-metin') || '';
      Promise.resolve(ortam.kopyala(metin)).then(ok => {
        const s = is.querySelector('span');
        const eski = s ? s.textContent : '';
        if(s) s.textContent = ok ? 'Kopyalandı' : 'Kopyalanamadı';
        else is.setAttribute('aria-label', ok ? 'Kopyalandı' : 'Kopyalanamadı');
        is.classList.toggle('is-kopyalandi', !!ok);
        ortam.zamanla(() => { if(s) s.textContent = eski; is.classList.remove('is-kopyalandi'); }, 1600);
      });
    }else if(ad === 'yedek-indir'){
      const y = merkez && merkez.yedekler;
      if(!y) return;
      const o = oturum() || {};
      Promise.resolve(ortam.indir('lifeos-yedek-kodlar-' + String(o.a || 'hesap').replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü_.-]/g, '') + '.txt',
        'LifeOS yedek kodları (' + (o.a || '') + ')\r\nHer biri girişi bir kez açar.\r\n\r\n' + y.join('\r\n') + '\r\n', 'text/plain')).catch(() => {});
    }else if(ad === 'yedekle'){
      is.disabled = true;
      merkezIs(async () => {
        const v = await yedekle();
        if(merkez){
          merkez.yedek = v;
          if(merkez.ben && merkez.ben.yedek) merkez.ben.yedek = Object.assign({}, merkez.ben.yedek, { son:ortam.simdi(), hata:'' });
        }
        const x = (v.yedekler || []).find(y => y.ad === v.alinan);
        return 'Yedek alındı' + (x ? ' · ' + boyut(x.bayt) : '') + (v.ikinci && v.ikinci.acik && !v.ikinci.hata ? '; ikinci yere de yazıldı.' : '.');
      });
    }else if(ad === 'geri-sor'){
      const yad = is.getAttribute('data-ad');
      is.disabled = true;
      merkezIs(async () => {
        const g = await yedekOnizle(yad);
        if(merkez) merkez.geriOnay = g;
        return '';
      }).then(() => {
        const f = document.getElementById('hesap-geri-sifre');
        if(f){ try{ f.focus(); }catch(e){ /* yok */ } }
      });
    }else if(ad === 'kopya-indir-sor'){
      const x = merkez && merkez.yedek && (merkez.yedek.yedekler || []).find(y => y.ad === is.getAttribute('data-ad'));
      if(!x) return;
      merkez.indirOnay = x;
      merkez.mesaj = '';
      merkezTazele();
      const f = document.getElementById('hesap-indir-sifre');
      if(f){ try{ f.focus(); }catch(e){ /* yok */ } }
    }else if(ad === 'kopya-indir-vazgec'){
      if(merkez){ merkez.indirOnay = null; merkezTazele(); }
    }else if(ad === 'geri-vazgec'){
      if(merkez){ merkez.geriOnay = null; merkez.mesaj = ''; merkezTazele(); }
    }else if(ad === 'ikinci-kapat'){
      is.disabled = true;
      merkezIs(async () => {
        const v = await yedekAyar('');
        if(merkez) merkez.yedek = v;
        return 'İkinci yer kapandı; yedekler yalnız bu bilgisayarda.';
      });
    }else if(ad === 'yedek-tamam'){
      if(merkez){ merkez.yedekler = null; merkez.mesaj = ''; merkezTazele(); }
    }else if(ad === 'iki-vazgec'){
      if(merkez){ merkez.ikiKurulum = null; merkezTazele(); }
    }else if(ad === 'takvim-ac' || ad === 'takvim-yenile'){
      is.disabled = true;
      merkezIs(async () => {
        const t = await takvimAc(ad === 'takvim-yenile');
        if(merkez){
          merkez.takvimOnay = false;
          merkez.baglanti = Object.assign({}, merkez.baglanti, { takvim:t });
          if(merkez.ben && merkez.ben.baglantilar) merkez.ben.baglantilar.takvim = true;
        }
        return ad === 'takvim-ac' ? 'Abonelik açık. Adresi takvim uygulamana ekle.' : 'Adres yenilendi; eskisi artık çalışmaz.';
      });
    }else if(ad === 'takvim-yenile-sor' || ad === 'takvim-vazgec'){
      if(merkez){ merkez.takvimOnay = ad === 'takvim-yenile-sor'; merkez.mesaj = ''; merkezTazele(); }
    }else if(ad === 'takvim-kapat'){
      is.disabled = true;
      merkezIs(async () => {
        const t = await takvimKapat();
        if(merkez){
          merkez.baglanti = Object.assign({}, merkez.baglanti, { takvim:t });
          if(merkez.ben && merkez.ben.baglantilar) merkez.ben.baglantilar.takvim = false;
        }
        return 'Abonelik kapandı; adres artık çalışmaz.';
      });
    }else if(ad === 'takvim-indir'){
      const t = merkez && merkez.baglanti && merkez.baglanti.takvim, base = sunucuAdresi();
      if(!t || !t.yol || base === null) return;
      is.disabled = true;
      merkezIs(async () => {
        let r;
        try{ r = await ortam.fetch(base + t.yol, { cache:'no-store', credentials:'omit' }); }
        catch(e){ const h = new Error('Sunucuya ulaşılamadı.'); h.kod = 0; throw h; }
        if(!r.ok) throw new Error('Takvim alınamadı (' + r.status + ').');
        await ortam.indir('lifeos-takvim.ics', await r.text(), 'text/calendar');
        return 'Takvim dosyası hazır. Google Takvim › Ayarlar › İçe aktar.';
      });
    }else if(ad === 'anahtar-sil'){
      const id = Number(is.getAttribute('data-id'));
      is.disabled = true;
      merkezIs(async () => {
        await anahtarSil(id);
        if(merkez){ merkez.baglanti = await baglantilar(); merkez.yeniAnahtar = null; }
        return 'Anahtar silindi; onu kullanan kısayol artık çalışmaz.';
      });
    }else if(ad === 'bag-vazgec'){
      merkezGeri();
    }else if(ad === 'bag-yeni'){
      bagBasla();
    }else if(ad === 'kisi-iki-kapat'){
      if(!merkez) return;
      const id = merkez.kisi;
      is.disabled = true;
      merkezIs(async () => {
        const u = await yonet(id, { iki_adim:false });
        if(merkez && merkez.kullanicilar){
          merkez.kullanicilar = merkez.kullanicilar.map(x => (x.id === u.id ? Object.assign({}, x, u, { iki_adim:false }) : x));
        }
        return 'İki adımlı doğrulaması kapandı.';
      }, '[data-hesap-kisi-mesaj]');
    }else if(ad === 'yonet'){
      const alan = is.getAttribute('data-alan'), d = is.getAttribute('data-deger');
      if(is.getAttribute('aria-pressed') === 'true' || !merkez) return;
      const id = merkez.kisi;
      merkezIs(async () => {
        const u = await yonet(id, { [alan]:d });
        if(merkez && merkez.kullanicilar){
          merkez.kullanicilar = merkez.kullanicilar.map(x => (x.id === u.id ? Object.assign({}, x, u) : x));
        }
        return 'Kaydedildi.';
      }, '[data-hesap-kisi-mesaj]');
    }
  }

  let bagli = false, basilan = null;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('pointerdown', e => { basilan = e.target; }, true);
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const d = t.closest('.ust__hesap');
      if(d){ e.preventDefault(); hesapDugmesi(d); return; }
      const cip = t.closest('[data-hesap-cip]');
      if(cip){
        e.preventDefault();
        if(oturum()) merkezAc(); else if(sunucu || ortam.yerelUygulama()) kapiAc();
        return;
      }
      /* Sayfanın dışına (karartmaya) dokunmak sayfayı kapatır; kartın
         içinde başlayıp dışarıda biten sürükleme (yazı seçme) kapatmaz. */
      if(t.matches && t.matches('[data-hesap-merkez]')){ if(basilan === t) merkezKapat(); return; }
      const is = t.closest('[data-hesap-panel] [data-hesap]');
      if(!is) return;
      eylem(is.getAttribute('data-hesap'), is);
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-hesap-form]') : null;
      if(!f) return;
      e.preventDefault();
      formIsle(f.getAttribute('data-hesap-form'), f);
    });
    const yazi = e => {
      const t = e.target;
      if(!t || !t.closest || !t.closest('[data-hesap-panel]')) return;
      if(t.hasAttribute && t.hasAttribute('data-sifre')) gucTazele(t);
      const f = t.closest('[data-hesap-form="profil"]');
      if(f) onizle(f);
      /* Altı haneli kod: rakam dışı atılır, «123 456» biçimi; altı hane
         tamamlanınca form kendiliğinden gönderilir (yapıştırmada da). */
      if(e.type === 'input' && t.hasAttribute && t.hasAttribute('data-kod')){
        const r = String(t.value || '').replace(/\D/g, '').slice(0, 6);
        const bicim = r.length > 3 ? r.slice(0, 3) + ' ' + r.slice(3) : r;
        if(t.value !== bicim) t.value = bicim;
        const form = t.closest('form'), d = form && form.querySelector('button[type=submit]');
        if(r.length === 6 && form && d && !d.disabled){
          if(typeof form.requestSubmit === 'function') form.requestSubmit(d);
          else d.click();
        }
      }
    };
    document.addEventListener('input', yazi);
    document.addEventListener('change', yazi);
    /* Büyük harf kilidi: şifre alanında basılan tuştan okunur. */
    const caps = e => {
      const t = e.target;
      if(!t || !t.hasAttribute || !t.hasAttribute('data-sifre') || typeof e.getModifierState !== 'function') return;
      const f = t.closest('form');
      const c = f && f.querySelector('.hesap__caps');
      if(c) c.hidden = !e.getModifierState('CapsLock');
    };
    document.addEventListener('keydown', caps);
    document.addEventListener('keyup', caps);
    /* Esc ve sekme tuşu: açık karttan dışarı çıkılmaz (aria-modal). */
    document.addEventListener('keydown', e => {
      const kok = document.querySelector('[data-hesap-kapi]') || document.querySelector('[data-hesap-merkez]');
      if(!kok) return;
      if(e.key === 'Escape'){
        if(kok.hasAttribute('data-hesap-merkez')){ e.preventDefault(); e.stopPropagation(); merkezGeri(); }
        else if(kapi.gorunum !== 'karsila'){
          e.preventDefault(); e.stopPropagation();
          kapiGit(kapi.gorunum === 'unuttum' || kapi.gorunum === 'kod' ? 'giris' : 'karsila');
        }
        return;
      }
      if(e.key !== 'Tab') return;
      const odak = Array.from(kok.querySelectorAll('button, [href], input:not([type=hidden]), textarea, select, summary'))
        .filter(el => !el.disabled && el.getClientRects().length && !(el.type === 'radio' && !el.checked));
      if(!odak.length) return;
      const ilk = odak[0], son = odak[odak.length - 1], a = document.activeElement;
      if(!kok.contains(a) || a === kok.firstElementChild){ e.preventDefault(); (e.shiftKey ? son : ilk).focus(); }
      else if(e.shiftKey && a === ilk){ e.preventDefault(); son.focus(); }
      else if(!e.shiftKey && a === son){ e.preventDefault(); ilk.focus(); }
    }, true);
    window.addEventListener('online', () => esitle());
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState !== 'visible') return;
      const s = ortam.simdi();
      if(s - sonGorunur < 10000) return;
      sonGorunur = s;
      esitle();
    });
  }

  /* ?bagla=482913 (söz 18): tabletin kamerası QR'ı açınca. Kod okunur ve
     adres çubuğundan hemen silinir. */
  function bagSorgu(){
    let kod = '';
    try{ kod = new URLSearchParams(ortam.konum().search || '').get('bagla') || ''; }catch(e){ kod = ''; }
    if(!kod) return '';
    ortam.sorguSil('bagla');
    kod = kod.replace(/\D/g, '');
    return kod.length === 6 ? kod : '';
  }
  function bagSorguAc(kod){
    if(!kod || oturum() || typeof document === 'undefined') return;
    if(kapiAcikMi()) kapiGit('bagla', { kod });
    else kapiAc('bagla', { kod });
    const f = document.querySelector('[data-hesap-kapi] [data-hesap-form="bagla"]');
    const d = f && f.querySelector('button[type=submit]');
    if(f && d && !document.getElementById('hesap-adres')) formIsle('bagla', f);
  }

  /* Modülün tek çağrısı (app.js, model yüklendikten sonra). */
  function kur(o){
    ayar = Object.assign({ modul:'spi' }, o || {});
    if(ayar.depo) ayar.depo.onDegisim = degisti;
    bagla();
    const bagKod = bagSorgu();
    if(ornekMi()){ durumYaz('ornek', 'Örnek profil eşitlenmez.'); return; }
    durumYaz('bilinmiyor', '');
    const giris = ayar.modul === 'giris';
    /* Söz 15: ağ beklemeden verilebilen karar hemen verilir. */
    if(giris){
      if(oturum() || betaMi()) girisHazir();
      else if(ortam.yerelUygulama()){ kapiAc(); girisHazir(); }
      ozetCiz();
      if(typeof window !== 'undefined' && window.addEventListener){
        window.addEventListener('pageshow', () => ozetCiz());
      }
    }
    yokla().then(() => {
      cipTazele();
      if(bagKod && !oturum() && (sunucu || ortam.yerelUygulama())) bagSorguAc(bagKod);
      else if(kapiGerekli()){
        if(!kapiAcikMi()) kapiAc();
        else if(kapi.gorunum === 'karsila') kapiTazele();   // sunucunun durumu (kurulum, kayıt) çizilsin
      }else if(giris && kapiAcikMi()) kapiKapat(false);
      if(giris) girisHazir();
      if(giris && oturum()) uyarilar().catch(() => null);  // söz 22: çipte nokta
      return esitle();
    }).catch(e => { if(giris) girisHazir(); console.error('Hesap:', e); });
    if(araId == null && typeof setInterval === 'function'){
      araId = setInterval(() => {
        if(typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        esitle();
      }, ARALIK);
    }
  }

  /* Testler için: bellekteki hâli bırakır. */
  function _sifirla(){
    if(erteleId != null) ortam.iptal(erteleId);
    if(yenileId != null) ortam.iptal(yenileId);
    if(cizimId != null) ortam.iptal(cizimId);
    erteleId = null; yenileId = null; cizimId = null; cizimler.length = 0;
    ayar = null; hal = { durum:'bilinmiyor', mesaj:'' }; sunucu = null;
    aktif = null; siradaki = null; panelMesaj = ''; onayBitis = 0;
    modelBekliyor = false; ekranBekliyor = false; tazeleme = null; profilTazelendi = false;
    ekAktif = false; sonGelen = 0; sonYayin = 0; sonUyari = 0; ekSon = null; uyari = { liste:null, yeni:[] };
    kapi = KAPI_BOS();
    kapiKapat(false);
    merkezKapat();
    bagDur();
    if(ozetId != null) ortam.iptal(ozetId);
    ozetId = null;
    if(typeof document !== 'undefined'){
      document.querySelectorAll('[data-hesap-kapi-cikis]').forEach(el => el.remove());
      document.documentElement.classList.remove('giris-hazir');
    }
  }

  /* Modül seçim sayfası (sistem/sunucu.py giris_html, telefonda da): giriş
     bir kez orada yapılır; çerez kapıya bakmadığı için üç modül girişli açılır. */
  try{
    const b = typeof document !== 'undefined' && document.currentScript;
    if(b && b.hasAttribute('data-giris')) kur({ modul:'giris' });
  }catch(e){ /* sayfa dışında (test) */ }

  return {
    kur, esitle, yokla, degisti, girisYap, kayitOl, soruGetir, kurtar, cikisYap, parolaDegistir, soruAyarla,
    betaGir, kapiAc, kapiAcikMi, dugme, durum, dinle, silmeNotu, panelHtml, adresDuzelt, cihazKimligi, cizIste,
    ben, profilAyarla, cihazlar, cihazCikar, otekilerdenCik, kullanicilar, yonet, kayitAyarla, kullaniciEkle,
    merkezAc, merkezKapat, merkezAcikMi, hatirlananlar, unut, sifreGucu, etkinlik, disaAktar, hesabiSil,
    ozetYaz, ozetOku, ozetCiz,
    girisKod, baglaKod, baglantilar, ikiAdimBaslat, ikiAdimOnayla, ikiAdimKapat, yedekYenile,
    bagKoduAc, bagDurum, anahtarAc, anahtarSil, takvimAc, takvimKapat, cihazAdlandir, uyarilar, uyariGordum,
    yedekDurum, yedekle, yedekAyar, yedekOnizle, geriYukle, yedekIndir, yedekYukle,
    _ortam:ortam, _sifirla, _istek:istek, _ekBekle:() => ekSon || Promise.resolve(), _imza:imza,
    CEREZ, ONEK,
  };
})();
