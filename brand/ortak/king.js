/* KING — her yerden sade sohbet (Apple Intelligence gibi).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/king.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `king.css`.
   ==================================================================

   Depo sahibi (2026-10-05): «her bölümden, her yerden bir şey yaparak King
   ile Apple Intelligence gibi konuşabilelim, çok sade minimalist; konuşma
   başlayınca kenarlardan çok hafif ışık süzülmesi; konuşmayı hissettiren
   bir baloncuk; şu sayfaya git, şu verileri gir, bana bugünün özeti gibi;
   hazır cevaplar — antrenman yapacağım, besin gireceğim, test çözeceğim,
   dil çalışacağım — tıklayınca kolay gelsin deyip o sayfaya atsın».

   NASIL AÇILIR: masaüstünde Ctrl'e iki kez basmak ya da kenardaki «King»;
   telefonda «+» › «King'e sor» ya da «+»ya basılı tutmak. Esc kapatır.

   Sözler:
   1. KURAL MOTORU KONUŞUR (AGENTS §1.1). Bu dosyada dil modeli yok:
      nereye gidileceğine, neyin kaydedileceğine ve özetteki sayılara kod
      karar verir; King yalnız kısa cümle kurar. Sohbet HKM'deki King'le
      yapılır (söz 6); orada da sayıyı kod üretir, model cümleye çevirir.
   2. ANLAŞILMAYAN İSTEK TAHMİN EDİLMEZ (§1.7): «anlayamadım» der ve neler
      yapabildiğini gösterir; rastgele bir sayfaya götürmez.
   3. VERİ ÖNCE ÖNİZLENİR: satır modülün KENDİ ayrıştırıcısına gider (SPİ:
      SP.Quick); kayıt yalnız «Kaydet»le. Yeni ayrıştırıcı yazılmaz.
   4. MODÜL ONSUZ DA ÇALIŞIR: King yalnız bir giriş yoludur; modül King'e,
      King de HKM'ye bağlı değildir: HKM kapalıysa, yavaşsa ya da modeli
      yoksa yerel King aynen sürer ve nedenini söyler.
   5. ADRES YALNIZ KATALOGDAN: modüller arası geçişte hedef `#king=<rota>`
      ile taşınır; katalogda olmayan rota yok sayılır.
   6. HKM'DEKİ KING İLE AYNI KONUŞMA (depo sahibi, 2026-10-06: «kingle
      konuşurken HKM'deki kingle konuşur gibi olacak, o AI kısmında»). HKM
      bağlıyken (modülün HKM işareti; bağın sahibi bu profil) sorular, özet
      ve yerelde anlaşılmayan her şey HKM'nin King'ine gider (/api/chat,
      agent king). Geçmişi HKM tutar: modülden konuşmak oradaki konuşmanın
      devamıdır. Yerelde kalan: «… git/aç» komutu, niyet cümlesi («antrenman
      yapacağım») ve kayıt önizlemesi — HKM modüle yazmaz (§1.4). Soru
      cümlesi, içinde sayfa adına benzeyen bir sözcük var diye sayfaya
      götürülmez.
   7. SES (depo sahibi, 2026-10-15: «ücretsiz ve uğraştırmadan King'i Apple
      Intelligence'a benzet, daha eylemsel, daha profesyonel»). Mikrofonla
      konuşulur, sesle sorulana sesle cevap verilir; kenar ışığı dinlerken
      ve konuşurken nabız gibi atar. Kurulum yok, ücret yok: tanıma ve ses
      tarayıcının kendisinindir. Seslendirmede yalnız CİHAZDAKİ Türkçe ses
      kullanılır; buluttaki «Online» sesler seçilmez (cevabın metni hiçbir
      şirkete gitmez). Tanımayı tarayıcı yapar; Chrome bunu kendi
      sunucusunda yapar, düğmenin açıklaması bunu söyler. Ses yoksa ya da
      izin verilmezse King yazıyla aynen sürer; ses BİLGİ taşımaz.
   8. SOHBETTE KALIR (depo sahibi, 2026-10-16: «King'e "fasulye yiyeceğim bir
      tabak" yazınca afiyet olsun desin, sohbet etsin, sonda "verilere
      ekleyeyim mi?" diye sorsun; yalnız yemek değil bütün sistemler; sohbette
      kalalım»). Veri cümlesine önce insan gibi karşılık verilir (yemekte
      «Afiyet olsun», antrenmanda «Eline sağlık», çalışmada «Kolay gelsin»),
      sonra önizleme ve «… ekleyeyim mi?». Cevap düğmeyle ya da yazıyla
      («evet», «ekle», «hayır») verilir; kayıttan sonra King açık kalır.
      Gelecek zamanlı cümle («yiyeceğim») kendiliğinden ölçüm olmaz
      (olumsuz.js, KR-1): King fiili çıkarıp kalanını modülün ayrıştırıcısına
      verir ve YALNIZ sorarak, «evet» denirse yazar. Olumsuz cümle («yemedim»)
      hiç yazılmaz. Niyet cümlesi («antrenman yapacağım») sayfaya kendiliğinden
      götürmez: sohbet cümlesi ve «açayım mı?»; açık «… git/aç» komutu ve hazır
      cevap çipi doğrudan gider. Karşılık cümleleri sabit bir tablodur
      (SOHBET); sayı ve karar yine modülün kodundadır.
   9. KÜÇÜK KUTU, KENDİLİĞİNDEN KAPANMAZ (depo sahibi, 2026-10-16: «King'e
      antrenman yapacağım diyorum, beni atıyor, kendini kapatıyor; istemiyorum.
      Sağ üstte küçük bir kutu olarak bizi dinlesin, görsün; biz kapatana kadar
      oradan yazayım, sesle konuşayım»). Sayfaya götürmek, dışarı tıklamak ya da
      perdeye dokunmak King'i KAPATMAZ, küçültür: sağ üstte ekranın adını,
      son cevabı, yazı alanını ve mikrofonu taşıyan bir kutu; altındaki sayfa
      kullanılır. Yalnız ✕ ya da Esc kapatır; Ctrl×2 küçükken büyütür. Niyet
      cümlesi («antrenman yapacağım») sayfayı hemen açar (8'deki «açayım mı?»
      sorusu kalktı: King açık kaldığı için sormak gereksiz). Öteki modüle
      geçince sayfa yenilenir; King orada küçük kutu olarak yeniden açılır.
      King hangi ekranda olduğunu bilir (modül `ekranDegisti()` der).
  10. ÖTEKİ MODÜLÜN İŞİ İLETİLİR (sunucu sözü 23). AYS'de «fasulye yedim» gibi
      başka modülün verisi yerelde anlaşılmaz; King onu tahmin etmez,
      «SPİ'ye ileteyim mi?» der. «İlet» satırı OTURUMLA o modülün gelen
      kutusuna bırakır; satırı yalnız o modül okur ve Onaylar'a öneri yapar
      (ölçüm onaysız yazılmaz). Giriş yoksa yalnız «SPİ'yi aç» kalır.
  11. FOTOĞRAF (depo sahibi, 2026-10-16: «King'e o an fotoğraf yükleyip
      gönderebilelim»). Düğmeyle, yapıştırarak (Ctrl+V) ya da sürükleyip
      bırakarak. Fotoğraf CİHAZDA kalır; King onu anlamaz, modülün KENDİ
      fotoğraf akışına teslim eder (`ayar.foto`: AYS «Soruyu çöz», SPİ «Öğün
      olarak oku»). Model yalnız o akışta, kullanıcının düğmesiyle çalışır.
      Modülde fotoğraf işi yoksa bu söylenir; uydurulmaz.
  12. EKRANI GÖSTER. King bulunduğun ekranın başlıklarını okur. Merkez
      bağlıysa ekrandaki yazıları (en çok EKRAN_EN_COK karakter) sorunla
      birlikte Merkez'deki King'e gönderir — yalnız «Ekranı göster»e
      basınca; düğmenin açıklaması bunu söyler.
  13. SESLİ SOHBET. Eller serbest: King konuşmasını bitirince yeniden
      dinler; «tamam», «görüşürüz» ya da iki kez sessizlik durdurur.
  14. SOHBETTE GERİ AL. Son kaydın geri alınması modülün kendi işlevidir
      (giris.js söz 8); «geri al» yazmak ya da düğmesi.
  15. SOHBET KALIR. Kapatıp açınca aynı günün son mesajları geri gelir
      (yalnız bu cihazda; fotoğraf saklanmaz). Başlıkta yapay zekâ bağlı mı
      yazar: «yapay zekâ» ya da «yerel».
  16. EKRANIMI PAYLAŞ (depo sahibi, 2026-10-16: «ekran paylaşmaktan kastım PC,
      telefon ya da başka bir ekran»). Bilgisayarda tarayıcının kendi seçicisi
      (getDisplayMedia): bir ekran, pencere ya da sekme. Paylaşım SÜREKLİ YAYIN
      DEĞİLDİR: yalnız kullanıcı soru sorduğunda o anın TEK karesi soruyla
      birlikte görüntü okuyan modele (modülün model katmanı, `ayar.model`)
      gider; kare saklanmaz. Veri cümlesi («40 soru çözdüm») paylaşım sürerken
      de yerel ayrıştırıcıya gider. Paylaşım sürerken kutuda «Ekran paylaşılıyor
      · Durdur» durur; tarayıcının çubuğundan durdurmak da biter. Telefonda
      tarayıcı ekran paylaşamaz: bu söylenir, ekran görüntüsünü fotoğraf
      olarak göndermek önerilir (söz 11). Görüntü okuyan model yoksa söylenir.
  17. GÖRÜNTÜYÜ YORUMLA. Fotoğraf ve ekran karesi için model talimatı sabittir:
      Türkçe, kısa; görmediği sayıyı uydurmaz, emin değilse söyler; sağlıkta
      teşhis koymaz, doz önermez (AGENTS §1.5). Cevap modelin OKUMASIDIR,
      ölçüm değildir: hiçbir kayda kendiliğinden yazılmaz.
  18. MODÜL DEĞİŞİNCE KAYBOLMAZ (depo sahibi, 2026-10-16: «AYS'den SPİ'ye
      geçerken sağ üstteki King kayboluyor»). Modüller ayrı köken: depoları
      ayrı. King açıkken durumu (küçük mü, son mesajlar, kaynak modül)
      TASIMA anahtarında tutulur; animasyon.js'in modüller arası taşıması onu
      adresle karşı kapıya götürür (kenar çubuğundan, seçiciden, King'in
      kendisinden — hangi yoldan geçilirse). Karşı modül anahtarı okur,
      SİLER ve King'i küçük kutu olarak sohbetiyle açar. Kendi modülünün
      eski anahtarı (sekme kapanmış, King açık kalmıştı) açılışta silinir;
      King kendiliğinden açılmaz. King kapanınca anahtar kalkar. Ekran
      paylaşımı taşınmaz (tarayıcı her sayfada yeniden izin ister). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.KING = (function(){
  'use strict';

  const L = window.LIFEOS;
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };

  /* Sayfalar: «şu sayfaya git». es = aranan sözcükler (küçük harf). */
  const SAYFALAR = [
    { modul:'spi', route:'today',     ad:'Bugün',      es:['bugün', 'genel bakış', 'ölçüm'] },
    { modul:'spi', route:'meals',     ad:'Öğün',       es:['öğün', 'besin', 'yemek', 'beslenme'] },
    { modul:'spi', route:'kitchen',   ad:'Mutfak',     es:['mutfak', 'tarif'] },
    { modul:'spi', route:'move',      ad:'Hareket',    es:['hareket', 'antrenman', 'egzersiz', 'spor'] },
    { modul:'spi', route:'labs',      ad:'Testler',    es:['tahlil', 'kan testi', 'laboratuvar', 'testler'] },
    { modul:'spi', route:'basket',    ad:'Bütçe',      es:['bütçe', 'market', 'sepet'] },
    { modul:'ays', route:'today',     ad:'Bugün',      es:['bugün', 'genel bakış'] },
    { modul:'ays', route:'week',      ad:'Hafta',      es:['hafta'] },
    { modul:'ays', route:'plan',      ad:'Program',    es:['program'] },
    { modul:'ays', route:'gelecek',   ad:'Gelecek', es:['gelecek', 'simülatör', 'bu gidişle', 'sınav günü'] },
    { modul:'ays', route:'subjects',  ad:'Konu kapanışı', es:['konu kapanış', 'kapanış', 'konu', 'ders'] },
    { modul:'ays', route:'solve',     ad:'Soru çöz',   es:['soru çöz', 'soru', 'test çöz'] },
    { modul:'ays', route:'exams',     ad:'Deneme',     es:['deneme', 'sınav'] },
    { modul:'ays', route:'cards',     ad:'Tekrar',     es:['tekrar', 'kart'] },
    { modul:'ays', route:'progress',  ad:'İlerleme',   es:['ilerleme'] },
    { modul:'esp', route:'today',     ad:'Bugün',      es:['bugün', 'genel bakış'] },
    { modul:'esp', route:'lang',      ad:'Dil',        es:['dil', 'ingilizce', 'almanca', 'kelime'] },
    { modul:'esp', route:'library',   ad:'Okuma',      es:['okuma', 'kitap'] },
    { modul:'esp', route:'writing',   ad:'Yazı',       es:['yazı', 'yazma'] },
    { modul:'esp', route:'symposium', ad:'Felsefe',    es:['felsefe'] },
    { modul:'esp', route:'history',   ad:'Tarih',      es:['tarih'] },
    { modul:'esp', route:'studio',    ad:'Ses',        es:['müzik', 'diksiyon'] },
  ];

  /* Hazır cevaplar — kullanıcının örnekleri, sırasıyla. */
  const HAZIR = [
    { ad:'Antrenman yapacağım', modul:'spi', route:'move', ek:{ sekme:'kuvvet' }, cevap:'Kolay gelsin.' },
    { ad:'Besin gireceğim',     modul:'spi', route:'meals', cevap:'Afiyet olsun.' },
    { ad:'Test çözeceğim',      modul:'ays', route:'solve', cevap:'Kolay gelsin.' },
    { ad:'Dil çalışacağım',     modul:'esp', route:'lang',  cevap:'Kolay gelsin.' },
    { ad:'Bugünün özeti',       ozet:true },
  ];

  /* Serbest yazıdan niyet: ilk eşleşen kazanır (sıra önemli). Türkçe
     harflerde \b çalışmaz: sözcük başı (^|\s) ile aranır. */
  const B = '(?:^|\\s)';
  const NIYET = [
    { es:new RegExp(B + '(tahlil|kan testi|laboratuvar)'), modul:'spi', route:'labs', cevap:'Tamam.' },
    { es:new RegExp(B + '(antrenman|egzersiz|idman|spor|ağırlık|kuvvet)'), modul:'spi', route:'move', ek:{ sekme:'kuvvet' }, cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(koş|yürüyüş|bisiklet|kardiyo)'), modul:'spi', route:'move', ek:{ sekme:'kardiyo' }, cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(besin|yemek|öğün|kahvaltı|yedim|yiyeceğim)'), modul:'spi', route:'meals', cevap:'Afiyet olsun.' },
    { es:new RegExp(B + '(deneme)'), modul:'ays', route:'exams', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(test|soru)'), modul:'ays', route:'solve', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(konu|ders)'), modul:'ays', route:'subjects', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(tekrar|kart)'), modul:'ays', route:'cards', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(dil|ingilizce|almanca|fransızca|kelime)'), modul:'esp', route:'lang', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(kitap|okuma|okuyacağım)'), modul:'esp', route:'library', cevap:'Keyifli okumalar.' },
    { es:new RegExp(B + '(yazı|yazacağım)'), modul:'esp', route:'writing', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(felsefe)'), modul:'esp', route:'symposium', cevap:'Kolay gelsin.' },
    { es:new RegExp(B + '(müzik|diksiyon)'), modul:'esp', route:'studio', cevap:'Kolay gelsin.' },
  ];

  const ortam = {
    git:url => { window.location.href = url; },
    zamanla:(fn, ms) => setTimeout(fn, ms),
    simdi:() => new Date(),
    hash:() => (typeof location !== 'undefined' ? location.hash : ''),
    hashSil:() => { try{ history.replaceState(null, '', location.pathname + location.search); }catch(e){ /* eski tarayıcı */ } },
    adres:k => (L.KABUK && L.KABUK.adres ? L.KABUK.adres(k) : null),
    /* Söz 15: sohbet bu cihazda; okunamazsa yok sayılır. */
    depo:{
      oku:k => { try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } },
      yaz:(k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ /* yer yok */ } },
      sil:k => { try{ localStorage.removeItem(k); }catch(e){ /* yok */ } },
    },
    nesneUrl:f => { try{ return URL.createObjectURL(f); }catch(e){ return ''; } },
    /* Söz 16: tarayıcının ekran seçicisi. Desteklenmiyorsa null. */
    ekranDestek:() => !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
    ekranBaslat:async bitince => {
      const akis = await navigator.mediaDevices.getDisplayMedia({ video:{ frameRate:{ ideal:2, max:5 } }, audio:false });
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.srcObject = akis;
      try{ await v.play(); }catch(e){ /* kare yine alınabilir */ }
      const iz = akis.getVideoTracks()[0];
      if(iz) iz.addEventListener('ended', () => bitince());
      return {
        kare:() => kareCiz(v, v.videoWidth, v.videoHeight),
        bitir:() => { try{ akis.getTracks().forEach(t => t.stop()); }catch(e){ /* durmuş */ } v.srcObject = null; },
      };
    },
    /* Dosyadan küçültülmüş JPEG (söz 17). */
    dosyaKare:file => new Promise((ok, ret) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { try{ ok(kareCiz(img, img.naturalWidth, img.naturalHeight)); }catch(e){ ret(e); } finally{ URL.revokeObjectURL(url); } };
      img.onerror = () => { URL.revokeObjectURL(url); ret(new Error('Görsel okunamadı')); };
      img.src = url;
    }),
    fetch:(u, o) => fetch(u, o),
    /* Ses (söz 7). Testler sahte tanıma ve sentez koyar. */
    tanima:() => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null,
    sentez:() => (typeof window !== 'undefined' && window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function')
      ? window.speechSynthesis : null,
    soz:m => new window.SpeechSynthesisUtterance(m),
  };
  /* HKM'deki King'in modelli cevabı yerel modelde saniyeler sürebilir. */
  const MERKEZ_ZAMAN_ASIMI = 60000;

  let ayar = null;           // { modul, git(route, ek), ozet(), veri:{ onizle(metin) }, hkm() → Beacon }
  let acik = false;
  let akis = [];             // [{ kim:'king'|'sen', metin, satirlar? }]
  let cipler = null;         // null = hazır cevaplar; ya da [{ ad, is }]
  let bekleyen = null;       // veri önizlemesi
  let bekleyenGit = null;    // «açayım mı?» diye sorulan sayfa (söz 8)
  let bekleyenIlet = null;   // { modul, metin } öteki modüle iletilecek satır (söz 10)
  let mini = false;          // küçük kutu (söz 9)
  let bekleyenFoto = null;   // söz 11
  let sonGeriAl = null;      // söz 14
  let sesliSohbet = false;   // söz 13
  let sessizSay = 0;
  const EKRAN_EN_COK = 2500;
  const KARE_EN_GENIS = 1280;
  const GORSEL_SISTEM = 'Sen LifeOS\'un asistanı King\'sin. Kullanıcı sana ekranını ya da bir fotoğrafı gösteriyor. '
    + 'Türkçe, kısa ve net cevap ver (en çok beş cümle). Görüntüde görmediğin bir sayıyı ya da bilgiyi uydurma; '
    + 'okuyamadığın ya da emin olmadığın yeri açıkça söyle. Sağlıkla ilgili görüntülerde teşhis koyma, ilaç ya da doz önerme. '
    + 'Yardımcı olabileceğin sonraki adımı tek cümleyle öner.';
  let paylasim = null;       // söz 16: { kare() → { mime, data }, bitir() }
  const TASIMA = 'lifeos.king';   // söz 18; animasyon.js TASINAN listesinde
  const FOTO_EN_BUYUK = 15 * 1024 * 1024;
  let sesli = false;         // son istek sesle geldiyse cevap da sesle (söz 7)
  let dinleyen = null;       // çalışan tanıma oturumu
  let konusuyor = 0;         // okunmayı bekleyen parça sayısı

  function kareCiz(kaynak, g, y){
    if(!g || !y) throw new Error('Ekran görüntüsü henüz hazır değil');
    const o = Math.min(1, KARE_EN_GENIS / g);
    const c = document.createElement('canvas');
    c.width = Math.round(g * o); c.height = Math.round(y * o);
    c.getContext('2d').drawImage(kaynak, 0, 0, c.width, c.height);
    const d = c.toDataURL('image/jpeg', 0.72);
    return { mime:'image/jpeg', data:d.slice(d.indexOf(',') + 1) };
  }

  function kac(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

  /* ------------------------------------------------------- anlama */

  function sayfaBul(t){
    let en = null, uzun = 0;
    SAYFALAR.forEach(s => s.es.forEach(e => {
      if(!new RegExp(B + e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(t)) return;
      const puan = e.length + (ayar && s.modul === ayar.modul ? 0.5 : 0);   // eşitlikte bulunulan modül
      if(puan > uzun){ uzun = puan; en = s; }
    }));
    return en;
  }

  /* Metin → ne yapılacak. Saf: depoya, ekrana dokunmaz (testler sınar). */
  function yorumla(metin){
    const t = kucuk(metin);
    if(!t) return { tur:'bos' };
    if(/(özet|nasıl gid|bugün ne|durumum|durum ne)/.test(t)) return { tur:'ozet' };
    /* «notlarım», «notlarımı aç», «bütün notlar»: ortak Notlarım paneli (notum.js). */
    if(/^(bütün |tüm )?notlar(ım|ımı|ımı aç|ımı göster)?( aç| göster)?$/.test(t) && L.NOTUM && L.NOTUM.kuruluMu && L.NOTUM.kuruluMu()) return { tur:'notlar' };
    const gitMi = new RegExp(B + '(git|aç|götür|geç|gidelim)').test(t);
    if(gitMi){
      const s = sayfaBul(t);
      if(s) return { tur:'git', hedef:s, cevap:'Tamam.', kaynak:'komut' };
    }
    /* Veri kapısı: modülün verdiği, yoksa ortak giriş kapısı (giris.js). */
    const veri = ayar && ayar.veri && typeof ayar.veri.onizle === 'function' ? ayar.veri
      : (L.GIRIS && L.GIRIS.kaynak ? L.GIRIS.kaynak() : null);
    if(veri){
      const dene = m => { try{ return veri.onizle(String(m).trim()); }catch(e){ return null; } };
      const g = gelecekMi(metin);
      let p = dene(metin);
      /* Söz 8: «fasulye yiyeceğim bir tabak» — fiil çıkar, kalanı anlaşılır mı? */
      if(!p && g){ const t2 = gelecekSiz(metin); if(t2) p = dene(t2); }
      if(p) return { tur:'veri', onizleme:p, gelecek:!!g, sohbet:sohbet(p, metin, !!g) };
    }
    for(const n of NIYET){
      if(n.es.test(t)) return { tur:'git', hedef:n, cevap:n.cevap, kaynak:'niyet', metin:String(metin).trim() };
    }
    const s = sayfaBul(t);
    if(s) return { tur:'git', hedef:s, cevap:'Tamam.', kaynak:'sayfa' };
    return { tur:'bilinmiyor' };
  }

  /* ------------------------------------------------------- sohbet (söz 8) */

  /* Gelecek zaman: olumsuz.js'in kapısı söyler; başka engel varsa (olumsuz,
     soru, belirsiz) gelecek sayılmaz, cümle olduğu gibi kalır. */
  function gelecekMi(metin){
    const O = L.Olumsuz;
    if(!O || !O.olcumEngeli) return null;
    const e = O.olcumEngeli(String(metin || ''));
    return e && e.neden === 'gelecek' ? e : null;
  }
  const yalin = w => kucuk(w).replace(/[.,!?;:]+/g, '');
  function gelecekSiz(metin){
    let t = String(metin || '');
    for(let i = 0; i < 3; i++){
      const e = gelecekMi(t);
      if(!e) break;
      const k = yalin(e.kelime);
      if(!k) return null;
      t = t.split(/\s+/).filter(w => yalin(w) !== k).join(' ');
    }
    if(L.Olumsuz && L.Olumsuz.olcumEngeli(t)) return null;   // başka bir engel kaldıysa yazılmaz
    return t.trim() || null;
  }

  /* Karşılık tablosu. tur modülün önizlemesinden gelir (p.tur); yoksa
     cümleden tahmin edilir. Seçim cümleye göre sabittir (aynı cümle, aynı
     karşılık): rastgele değil, testle sınanır. */
  const SOHBET = {
    ogun:    { gecti:['Afiyet olsun!', 'Afiyet şeker olsun!'], gelecek:['Şimdiden afiyet olsun!'], soru:'Öğünlerine ekleyeyim mi?' },
    su:      { gecti:['Afiyet olsun!'], gelecek:['Afiyet olsun!'], soru:'Bugünün suyuna ekleyeyim mi?' },
    hareket: { gecti:['Eline sağlık, helal olsun!', 'Eline sağlık, güzel iş!'], gelecek:['Kolay gelsin, iyi antrenmanlar!'], soru:'Antrenmanlarına ekleyeyim mi?' },
    uyku:    { gecti:['Günaydın! Uykunu not edelim.', 'Tamam, uykunu not edelim.'], gelecek:['İyi uykular!'], soru:'Uyku kaydına ekleyeyim mi?' },
    olcum:   { gecti:['Tamam, gördüm.'], gelecek:['Tamam.'], soru:'Günlük ölçümüne ekleyeyim mi?' },
    tahlil:  { gecti:['Geçmiş olsun, sonuçları gördüm.'], gelecek:['Tamam.'], soru:'Tahlillerine ekleyeyim mi?' },
    calisma: { gecti:['Eline sağlık, emeğine sağlık!', 'Helal olsun, güzel çalışma!'], gelecek:['Kolay gelsin, başarılar!'], soru:'Çalışma kaydına ekleyeyim mi?' },
    oturum:  { gecti:['Eline sağlık, güzel çalışma!', 'Emeğine sağlık!'], gelecek:['Kolay gelsin, keyifli çalışmalar!'], soru:'Bugünün oturumlarına ekleyeyim mi?' },
    not:     { gecti:['Güzel bir not.'], gelecek:['Güzel bir not.'], soru:'Notlarına ekleyeyim mi?' },
    veri:    { gecti:['Eline sağlık!'], gelecek:['Kolay gelsin!'], soru:'Verilerine ekleyeyim mi?' },
  };
  function turTahmin(t){
    if(/(ye(dim|di|yeceğim|rim)|iç(tim|eceğim)|kahvaltı|öğle yemeği|akşam yemeği|yemek|tabak|porsiyon)/.test(t)) return 'ogun';
    if(/(uyu(dum|yacağım)|uyku)/.test(t)) return 'uyku';
    if(/(koş|yürü|antrenman|idman|spor|egzersiz|bisiklet|yüz(düm|eceğim))/.test(t)) return 'hareket';
    if(/(soru|paragraf|problem|deneme|ders|konu)/.test(t)) return 'calisma';
    return 'veri';
  }
  function sohbet(p, metin, gelecek){
    const tur = SOHBET[p && p.tur] ? p.tur : turTahmin(kucuk(metin));
    const s = SOHBET[tur] || SOHBET.veri;
    const l = gelecek ? s.gelecek : s.gecti;
    let h = 0;
    String(metin || '').split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; });
    return { tur, selam:l[h % l.length], soru:s.soru };
  }
  /* Söz 10: cümle bir VERİ mi (sayı ya da geçmiş zaman: «yedim», «koştum»),
     yoksa niyet mi («antrenman yapacağım»)? Yalnız iletme sorusu için. */
  function veriGibi(m){
    const t = kucuk(m);
    return /\d/.test(t) || /(?:d|t)(?:ı|i|u|ü)m(?=$|\s|[.,!])/.test(t);
  }
  /* ---------- söz 11: fotoğraf ---------- */
  function fotoIsleri(){ return (ayar && Array.isArray(ayar.foto)) ? ayar.foto.filter(x => x && x.ad && typeof x.is === 'function') : []; }
  function fotoAl(file){
    if(!acik || !file) return false;
    if(!/^image\//.test(file.type || '')){ soyle('Bu bir fotoğraf değil; yalnız görsel alabilirim.'); return false; }
    if(file.size > FOTO_EN_BUYUK){ soyle('Fotoğraf çok büyük (en çok 15 MB). Daha küçük bir kırpma dener misin?'); return false; }
    akis.push({ kim:'sen', foto:ortam.nesneUrl(file), metin:'(fotoğraf)' });
    const l = fotoIsleri();
    const gorur = gorselZincir().length > 0;
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null;
    if(!l.length && !gorur){
      bekleyenFoto = null; cipler = null;
      soyle('Fotoğrafı aldım ama ' + (MODUL_AD[ayar.modul] || 'bu modül') + '’de fotoğrafla yapılan bir iş yok. AYS’de soru çözdürebilir, SPİ’de öğün okutabilirim.');
      return true;
    }
    bekleyenFoto = file;
    cipler = l.map((x, i) => ({ ad:x.ad, is:'foto:' + i }))
      .concat(gorur ? [{ ad:'Ne gördüğünü söyle', is:'foto-yorum' }] : [])
      .concat([{ ad:'Vazgeç', is:'vazgec' }]);
    soyle('Fotoğrafı aldım; bu cihazda kalıyor. Ne yapalım?');
    return true;
  }
  async function fotoIsle(i){
    const x = fotoIsleri()[i], f = bekleyenFoto;
    bekleyenFoto = null; cipler = null;
    if(!x || !f) return;
    kucult();
    try{
      const r = await x.is(f);
      soyle((r && String(r)) || 'Tamam, fotoğrafı yerine koydum.');
    }catch(e){ soyle('Fotoğraf işlenemedi: ' + ((e && e.message) || 'bilinmeyen hata')); }
  }

  /* ---------- söz 12: ekranı göster ---------- */
  function ekranOku(){
    if(typeof document === 'undefined') return { ad:'', basliklar:[], metin:'' };
    const kok = document.getElementById('app') || document.querySelector('main') || document.body;
    const gor = el => { try{ const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null; }catch(e){ return false; } };
    const basliklar = [];
    kok.querySelectorAll('h1, h2, h3, .kutu__ad, .card__title').forEach(el => {
      if(el.closest('[data-king]') || !gor(el)) return;
      const t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if(t && t.length <= 60 && basliklar.indexOf(t) < 0) basliklar.push(t);
    });
    const metin = String(kok.innerText || '').replace(/\s+/g, ' ').trim().slice(0, EKRAN_EN_COK);
    return { ad:ekranAdi(), basliklar:basliklar.slice(0, 12), metin };
  }
  async function ekranGoster(){
    const e = ekranOku();
    akis.push({ kim:'sen', metin:'(ekranı gösterdi)' });
    cipler = null;
    if(baglanti()){
      const bek = { kim:'king', bekliyor:true, metin:'' };
      akis.push(bek); ciz(false);
      const r = await merkezeSor('Kullanıcı bana bulunduğu ekranı gösteriyor (' + MODUL_AD[ayar.modul] + (e.ad ? ' · ' + e.ad : '')
        + '). Ekrandaki yazılar: «' + e.metin + '». Kısaca ne gördüğünü ve sıradaki en mantıklı adımı söyle; sayı uydurma, ekrandakini kullan.');
      akis = akis.filter(m => m !== bek);
      if(r.ok){ soyle(r.text); return r; }
    }
    soyle((e.ad ? e.ad + ' ekranındasın.' : 'Bu ekranda:') + (e.basliklar.length ? ' Gördüklerim:' : ' Okuyabildiğim bir başlık yok.'),
      e.basliklar.slice(0, 8));
    return e;
  }

  /* ---------- söz 16–17: ekranı paylaş, görüntüyü yorumla ---------- */
  function modelKatmani(){ try{ return ayar && ayar.model ? ayar.model() : null; }catch(e){ return null; } }
  function gorselZincir(){
    const M = modelKatmani();
    try{ return M && M.visionChain ? M.visionChain(null) : []; }catch(e){ return []; }
  }
  const GORSEL_YOK = 'Görüntüyü anlamak için görüntü okuyan bir yapay zekâ gerekiyor. Ayarlar’dan (Ofis › Model) ücretsiz '
    + 'Google AI Studio (Gemini) bağlarsan ekranını ve fotoğraflarını yorumlayabilirim.';
  async function gorselCevap(soru, resim){
    const zincir = gorselZincir();
    if(!zincir.length){ soyle(GORSEL_YOK); return null; }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek); ciz(false);
    try{
      const M = modelKatmani();
      const r = await M.complete(zincir, { system:GORSEL_SISTEM, temperature:0.3, maxTokens:700,
        messages:[{ role:'user', text:String(soru || 'Bu görüntüde ne var?'), images:[resim] }] });
      akis = akis.filter(m => m !== bek);
      soyle(String((r && r.text) || '').trim() || 'Görüntüden bir şey okuyamadım.');
      return r;
    }catch(e){
      akis = akis.filter(m => m !== bek);
      const M = modelKatmani();
      soyle('Görüntüyü yorumlayamadım: ' + ((M && M.errorText && e && e.code) ? M.errorText(e.code) : ((e && e.message) || 'model yanıt vermedi')));
      return null;
    }
  }
  async function paylasimBaslat(){
    if(paylasim){ paylasimBitir(); return false; }
    if(!ortam.ekranDestek()){
      soyle('Bu cihazda tarayıcı ekran paylaşamıyor (telefonda tarayıcılar buna izin vermiyor). Ekran görüntüsü alıp '
        + 'fotoğraf olarak gönderirsen ne gördüğümü söylerim.');
      return false;
    }
    if(!gorselZincir().length){ soyle(GORSEL_YOK); return false; }
    try{
      paylasim = await ortam.ekranBaslat(() => { if(paylasim){ paylasim = null; soyle('Ekran paylaşımı bitti.'); } });
    }catch(e){
      paylasim = null;
      soyle(e && e.name === 'NotAllowedError' ? 'Ekran paylaşımı iptal edildi.' : 'Ekran paylaşılamadı: ' + ((e && e.message) || 'bilinmeyen hata'));
      return false;
    }
    soyle('Ekranını görüyorum. Ne sorarsan o anki ekranı yorumlarım; görüntü yalnız sorduğunda yapay zekâya gider, saklanmaz.');
    return true;
  }
  function paylasimBitir(){
    const p = paylasim;
    paylasim = null;
    if(p) try{ p.bitir(); }catch(e){ /* durmuş */ }
    if(acik) soyle('Ekran paylaşımını durdurdum.');
  }
  async function fotoYorumla(){
    const f = bekleyenFoto;
    bekleyenFoto = null; cipler = null;
    if(!f) return null;
    let resim = null;
    try{ resim = await ortam.dosyaKare(f); }catch(e){ soyle('Fotoğraf okunamadı.'); return null; }
    return gorselCevap('Bu fotoğrafta ne var? Kısaca söyle; LifeOS’ta işime yarayacak bir şey (soru, öğün, ölçüm, plan) varsa belirt.', resim);
  }

  /* ---------- söz 13: sesli sohbet ---------- */
  function sohbetDevam(){
    if(!sesliSohbet || !acik || dinleyen || konusuyor || akis.some(m => m.bekliyor)) return;
    dinle();
  }
  function sesliSohbetAc(){
    if(!ortam.tanima()){ soyle('Bu tarayıcı konuşmayı tanımıyor; yazarak devam edebilirsin.'); return false; }
    sesliSohbet = !sesliSohbet;
    sessizSay = 0;
    if(!sesliSohbet){ if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } } soyle('Sesli sohbeti bitirdim.'); return false; }
    sesli = true;
    soyle('Seni dinliyorum. Bitirmek için «tamam» de.');
    return true;
  }

  /* ---------- söz 14: geri al ---------- */
  async function geriAlYap(){
    const g = sonGeriAl;
    sonGeriAl = null; cipler = null;
    if(!g){ soyle('Geri alınacak bir kayıt yok.'); return false; }
    try{ await g(); soyle('Geri aldım.'); return true; }
    catch(e){ soyle('Geri alamadım: ' + ((e && e.message) || 'bilinmeyen hata')); return false; }
  }

  async function ilet(){
    const x = bekleyenIlet;
    bekleyenIlet = null; bekleyenGit = null; cipler = null;
    if(!x) return;
    try{
      const r = await L.HESAP.gelenBirak(x.modul, x.metin);
      soyle('İlettim. ' + ((r && r.mesaj) || ''));
    }catch(e){
      soyle('İletemedim: ' + ((e && e.message) || 'sunucuya ulaşılamadı') + '. ' + MODUL_AD[x.modul] + '’yi açıp orada yazabilirsin.');
    }
  }

  const EVET = /^(evet|ekle|ekleyebilirsin|olur|tamam|kaydet|yaz|ok|okey|aç|açabilirsin|e|tabii|tabi|lütfen)( |$|[.,!])/;
  const HAYIR = /^(hayır|hayir|yok|vazgeç|gerek yok|ekleme|istemem|boşver|boş ver|açma|sonra)( |$|[.,!])/;

  /* Soru cümlesi mi (soru işareti ya da soru sözcüğü/eki)? Sözcük başı (^|\s). */
  const SORU = new RegExp('\\?|' + B + '(ne|neden|niye|nasıl|hangi|kaç|kim|nerede|nereye|niçin|m[ıiuü](?:s[ıiuü]n(?:[ıiuü]z)?|y[ıiuü][mz]|d[ıiuü]r)?)(?=$|\\s|[.,!])');
  function soruMu(t){ return SORU.test(kucuk(t)); }

  /* ------------------------------------------------------- HKM'deki King (söz 6) */

  function baglanti(){
    const b = ayar && ayar.hkm ? ayar.hkm() : null;
    if(!b || typeof b.settings !== 'function') return null;
    const a = b.settings() || {};
    if(!a.enabled || !a.token || !(b.urlOk ? b.urlOk(a.url) : a.url)) return null;
    return { url:String(a.url).replace(/\/$/, ''), token:a.token };
  }
  function bugunISO(){
    const d = ortam.simdi();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Doner: { ok:true, text, mode } ya da { ok:false, neden:'baglanti'|'yok' }. */
  async function merkezeSor(metin){
    const k = baglanti();
    if(!k) return { ok:false, neden:'baglanti' };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), MERKEZ_ZAMAN_ASIMI) : null;
    try{
      /* fetch bir nesnenin yöntemi olarak çağrılamaz («Illegal invocation»). */
      const f = ortam.fetch;
      const res = await f(k.url + '/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ text:String(metin).trim(), agent:'king', date:bugunISO() }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      if(res.status === 200 && g && g.ok !== false && typeof g.text === 'string' && g.text.trim()){
        return { ok:true, text:g.text.trim(), mode:g.mode || '' };
      }
      return { ok:false, neden:res.status === 200 ? 'yok' : 'baglanti' };
    }catch(e){
      return { ok:false, neden:'baglanti' };
    }finally{
      if(t) clearTimeout(t);
    }
  }

  /* ------------------------------------------------------- eylem */

  function gecerliRota(modul, route){
    return SAYFALAR.some(s => s.modul === modul && s.route === route)
      || HAZIR.some(h => h.modul === modul && h.route === route)
      || NIYET.some(n => n.modul === modul && n.route === route);
  }

  /* Aynı modülde doğrudan; ötekinde adresiyle (#king=rota[:sekme]). */
  function git(h){
    if(!ayar || !h) return false;
    if(h.modul === ayar.modul){
      kucult();                                    // söz 9: kapanmaz, küçülür
      try{ ayar.git(h.route, h.ek || {}); }catch(e){ console.error('King: git', e); }
      ekranDegisti();
      return true;
    }
    const url = ortam.adres(h.modul);
    if(!url){
      soyle(MODUL_AD[h.modul] + ' bu sayfadan açılamıyor; LifeOS panelinden aç.');
      return false;
    }
    const A = L && L.ANIMASYON;
    if(acik && A && typeof A.tasimaEkle === 'function'){
      tasimaYaz(null, { route:h.route, sekme:(h.ek && h.ek.sekme) || null });
      ortam.git(A.tasimaEkle(url));
      return true;
    }
    ortam.git(url + '#king=' + h.route + (h.ek && h.ek.sekme ? ':' + h.ek.sekme : ''));
    return true;
  }

  function ozetSatirlari(){
    let s = [];
    try{ s = (ayar && ayar.ozet ? ayar.ozet() : []) || []; }catch(e){ s = []; }
    return (Array.isArray(s) ? s : [s]).filter(Boolean).map(String);
  }

  /* ------------------------------------------------------- ses (söz 7) */

  /* Cihazdaki en iyi Türkçe ses. Buluttaki ses (localService false,
     «Online») hiç seçilmez. Saf: testler sınar. */
  function sesSec(liste){
    const tr = (liste || []).filter(v => v && /^tr([-_]|$)/i.test(v.lang || '') && v.localService !== false
      && !/online/i.test(v.name || ''));
    if(!tr.length) return null;
    const puan = v => (/premium|enhanced|gelişmiş|natural|neural/i.test(v.name || '') ? 4 : 0)
      + (/siri|yelda/i.test(v.name || '') ? 2 : 0) + (v.default ? 1 : 0);
    return tr.slice().sort((a, b) => puan(b) - puan(a))[0];
  }
  /* Kısa parçalar: uzun metinde Chrome okumayı yarıda sessizce keser. */
  function parcala(metin){
    return String(metin || '').replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/).reduce((l, p) => {
      if(!p) return l;
      if(l.length && (l[l.length - 1] + ' ' + p).length <= 180) l[l.length - 1] += ' ' + p; else l.push(p);
      return l;
    }, []);
  }
  function durum(){
    if(typeof document === 'undefined') return;
    const el = document.querySelector('[data-king]');
    if(!el) return;
    el.classList.toggle('is-dinliyor', !!dinleyen);
    el.classList.toggle('is-konusuyor', konusuyor > 0);
    const m = el.querySelector('.king__mik');
    if(m){
      m.classList.toggle('is-acik', !!dinleyen);
      m.setAttribute('aria-pressed', dinleyen ? 'true' : 'false');
      m.setAttribute('aria-label', dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor');
    }
  }
  function sus(){
    const sz = ortam.sentez();
    if(sz) try{ sz.cancel(); }catch(e){ /* yok */ }
    konusuyor = 0;
    durum();
  }
  function seslendir(metin){
    const sz = ortam.sentez();
    if(!sz || !metin) return;
    try{ sz.cancel(); }catch(e){ /* yok */ }
    const ses = sesSec(sz.getVoices ? sz.getVoices() : []);
    const parcalar = parcala(metin);
    konusuyor = parcalar.length;
    parcalar.forEach(p => {
      const u = ortam.soz(p);
      u.lang = 'tr-TR';
      if(ses) u.voice = ses;
      u.rate = 1.03;
      u.onend = u.onerror = () => { konusuyor = Math.max(0, konusuyor - 1); durum(); if(!konusuyor) sohbetDevam(); };
      try{ sz.speak(u); }catch(e){ konusuyor = 0; }
    });
    durum();
  }

  function dinle(){
    if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } return; }
    const T = ortam.tanima();
    if(!T) return;
    sus();
    let r;
    try{ r = new T(); }catch(e){ return; }
    r.lang = 'tr-TR';
    r.interimResults = true;
    r.continuous = false;
    let son = '', hata = '';
    r.onresult = e => {
      let ara = '', kesin = '';
      for(let i = 0; i < e.results.length; i++){
        const x = e.results[i];
        if(x.isFinal) kesin += x[0].transcript; else ara += x[0].transcript;
      }
      son = (kesin || ara).trim();
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      if(g) g.value = (kesin + ara).trim();
    };
    r.onerror = e => { hata = (e && e.error) || 'hata'; };
    r.onend = () => {
      dinleyen = null;
      durum();
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      if(son){
        if(g) g.value = '';
        sesli = true;
        sessizSay = 0;
        /* Söz 13: «tamam», «görüşürüz» sesli sohbeti bitirir. */
        if(sesliSohbet && /^(tamam|teşekkürler|teşekkür ederim|görüşürüz|dur|bitti|kapat sesi|yeter)[.!]?$/i.test(kucuk(son))){
          sesliSohbet = false; akis.push({ kim:'sen', metin:son }); soyle('Tamam, sesli sohbeti bitirdim. Yazarak devam edebilirsin.'); return;
        }
        isle(son);
      }else if(sesliSohbet && (!hata || hata === 'no-speech')){
        sessizSay++;
        if(sessizSay >= 2){ sesliSohbet = false; sessizSay = 0; soyle('Sesini duyamadım; sesli sohbeti durdurdum.'); }
        else ortam.zamanla(sohbetDevam, 400);
      }else if(hata === 'not-allowed' || hata === 'service-not-allowed'){
        sesliSohbet = false;
        soyle('Mikrofon izni verilmedi. Tarayıcının adres çubuğundan izin verebilir ya da yazabilirsin.');
      }else if(hata && hata !== 'aborted'){
        soyle(hata === 'no-speech' ? 'Bir şey duyamadım. Yeniden dener misin?' : 'Ses tanınamadı; yazarak da sorabilirsin.');
      }
    };
    dinleyen = r;
    try{ r.start(); }catch(e){ dinleyen = null; }
    durum();
  }

  /* Söz 15: aynı günün son mesajları bu cihazda. */
  const depoAnahtar = () => 'king.sohbet.' + ((ayar && ayar.modul) || 'x');
  function sakla(){
    if(!ayar) return;
    const l = akis.filter(m => !m.bekliyor).slice(-8).map(m => ({ kim:m.kim, metin:m.foto ? '(fotoğraf)' : (m.metin || ''),
      satirlar:m.satirlar || null, son:m.son || null }));
    ortam.depo.yaz(depoAnahtar(), { gun:bugunISO(), akis:l });
    tasimaYaz(l);
  }
  /* Söz 18: açıkken taşınacak durum; kapalıyken yok. */
  function tasimaYaz(l, git){
    if(!ayar) return;
    if(!acik){ ortam.depo.sil(TASIMA); return; }
    const liste = (l || akis.filter(m => !m.bekliyor).slice(-6).map(m => ({ kim:m.kim, metin:m.foto ? '(fotoğraf)' : (m.metin || '') })))
      .slice(-6).map(m => ({ kim:m.kim, metin:String(m.metin || '').slice(0, 200) }));
    ortam.depo.yaz(TASIMA, { acik:true, mini:true, kaynak:ayar.modul, akis:liste, zaman:Date.now(), git:git || null });
  }
  function geriGetir(){
    const v = ortam.depo.oku(depoAnahtar());
    return v && v.gun === bugunISO() && Array.isArray(v.akis) ? v.akis.filter(m => m && m.metin) : [];
  }

  function soyle(metin, satirlar, onizleme, son){
    akis.forEach(m => { m.yeni = false; });
    akis.push({ kim:'king', metin, satirlar, onizleme, son, yeni:true });
    /* Söz 8: sohbet görünür kalsın; son altı satır. */
    akis = akis.slice(-6);
    sakla();
    ciz();
    if(sesliSohbet && !ortam.sentez()) ortam.zamanla(sohbetDevam, 600);
    if(sesli) seslendir([metin].concat(satirlar || [], onizleme ? [onizleme.metin] : [], son ? [son] : []).join('. ').replace(/\.\.+/g, '.').replace(/([!?])\./g, '$1'));
  }

  async function isle(metin){
    /* Söz 8: bekleyen soruya yazıyla cevap («evet», «hayır»). */
    const t0 = kucuk(metin);
    if((bekleyen || bekleyenGit || bekleyenIlet) && (EVET.test(t0) || HAYIR.test(t0))){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      if(EVET.test(t0)){ if(bekleyen) await kaydet(); else if(bekleyenIlet) await ilet(); else gitOnayla(); }
      else vazgec();
      return { tur:EVET.test(t0) ? 'evet' : 'hayir' };
    }
    /* Söz 14: «geri al», «sonu sil», «onu sil». */
    if(/^(geri al|son (kaydı|kayıt|girdiyi) (geri al|sil)|onu (sil|geri al)|sil onu|yanlış oldu geri al)[.!]?$/.test(t0)){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      await geriAlYap();
      return { tur:'geri-al' };
    }
    const y = yorumla(metin);
    if(y.tur === 'bos') return y;
    /* Söz 16: paylaşım sürerken soru o anın karesiyle; veri cümlesi yerelde. */
    if(paylasim && y.tur !== 'veri' && !(y.tur === 'git' && y.kaynak === 'komut')){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
      let kare = null;
      try{ kare = paylasim.kare(); }catch(e){ soyle('Ekranın karesi alınamadı: ' + ((e && e.message) || 'bilinmeyen hata')); return { tur:'ekran' }; }
      await gorselCevap(String(metin).trim(), kare);
      return { tur:'ekran' };
    }
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null;
    bekleyenGit = null;
    bekleyenIlet = null;
    cipler = null;
    /* Söz 6: soru, özet ve anlaşılmayan istek HKM'deki King'e. */
    const merkeze = !!baglanti() && (y.tur === 'bilinmiyor' || y.tur === 'ozet'
      || (y.tur === 'git' && y.kaynak !== 'komut' && soruMu(metin)));
    let neden = null;
    if(merkeze){
      const bek = { kim:'king', bekliyor:true, metin:'' };
      akis.push(bek);
      ciz(false);
      const r = await merkezeSor(metin);
      akis = akis.filter(m => m !== bek);
      if(r.ok){
        soyle(r.text);
        return { tur:'merkez', mode:r.mode };
      }
      neden = r.neden;
    }
    return yerel(y, neden);
  }

  /* Yerel King (HKM yoksa ya da cevap veremediyse; sayfa ve kayıt hep burada). */
  function yerel(y, neden){
    if(y.tur === 'notlar'){
      kapat();
      if(L.NOTUM && L.NOTUM.panelAc) L.NOTUM.panelAc();
      return y;
    }
    if(y.tur === 'ozet'){
      const s = ozetSatirlari();
      soyle(s.length ? (MODUL_AD[ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', s);
    }else if(y.tur === 'git' && y.kaynak === 'niyet' && y.hedef.modul !== ayar.modul && veriGibi(y.metin)){
      /* Söz 10: öteki modülün VERİSİ («fasulye yedim») tahmin edilmez; iletilir. */
      const s = SAYFALAR.find(x => x.modul === y.hedef.modul && x.route === y.hedef.route);
      const ad = MODUL_AD[y.hedef.modul];
      bekleyenGit = y.hedef;
      const giris = !!(L.HESAP && L.HESAP.durum && L.HESAP.durum().oturum && L.HESAP.gelenBirak);
      bekleyenIlet = giris ? { modul:y.hedef.modul, metin:y.metin } : null;
      cipler = (giris ? [{ ad:ad + '’ye ilet', is:'ilet' }] : []).concat([{ ad:(s ? s.ad : ad) + ' aç', is:'git-onay' }, { ad:'Gerek yok', is:'vazgec' }]);
      soyle(sohbet({ tur:null }, y.metin, false).selam, null, null,
        giris ? 'Bu ' + ad + '’nin işi. ' + ad + '’ye ileteyim mi? ' + ad + ' açılınca Onaylar’a düşer, sen onaylayınca yazılır.'
          : 'Bu ' + ad + '’nin işi; buradan kaydedemem. ' + ad + '’yi açayım mı? (İletmek için hesaba giriş gerekir.)');
    }else if(y.tur === 'git'){
      soyle(eylemCumlesi(y.hedef, y.cevap));
      ortam.zamanla(() => git(y.hedef), sesli ? 1100 : 650);
    }else if(y.tur === 'veri'){
      bekleyen = y.onizleme;
      const s = y.sohbet || sohbet(y.onizleme, '', !!y.gelecek);
      cipler = [{ ad:'Evet, ekle', is:'kaydet' }, { ad:'Hayır', is:'vazgec' }];
      soyle(s.selam, null,
        { metin:y.onizleme.metin, liste:(y.onizleme.parcalar || []).length > 1 ? y.onizleme.parcalar.map(x => x.metin) : null,
          ipucu:y.gelecek ? 'Henüz yapmadıysan, yaptıktan sonra da söyleyebilirsin.' : (y.onizleme.ipucu || '') },
        s.soru);
    }else{
      const on = neden === 'yok' ? 'King’in modeli şu an kapalı. '
        : neden === 'baglanti' ? 'Merkeze (HKM) şu an ulaşılamadı. ' : '';
      soyle(on + 'Bunu anlayamadım. Şunlardan birini seçebilir ya da «hareket sayfasına git», «uyku 7», '
        + '«bugünün özeti» gibi yazabilirsin.');
    }
    return y;
  }

  async function kaydet(){
    const p = bekleyen;
    bekleyen = null;
    cipler = null;
    if(!p) return;
    try{
      const r = await p.kaydet();
      const metinR = r && typeof r === 'object' ? r.metin : r;
      sonGeriAl = r && typeof r === 'object' && typeof r.geriAl === 'function' ? r.geriAl : null;
      const m = String((metinR && String(metinR)) || 'Ekledim').trim().replace(/[.!]*$/, '.');
      if(sonGeriAl) cipler = [{ ad:'Geri al', is:'geri-al' }];
      soyle(m + ' Başka bir şey var mı?');
    }catch(e){
      soyle('Kaydedilemedi: ' + ((e && e.message) || 'bilinmeyen hata'));
    }
  }

  function vazgec(){
    const git0 = !!bekleyenGit;
    const foto0 = !!bekleyenFoto;
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenFoto = null; cipler = null;
    soyle(git0 || foto0 ? 'Tamam, buradayım.' : 'Tamam, eklemedim.');
  }
  function gitOnayla(){
    const h = bekleyenGit;
    bekleyenGit = null; bekleyenIlet = null; cipler = null;
    if(!h) return;
    soyle(eylemCumlesi(h, 'Tamam.'));
    ortam.zamanla(() => git(h), sesli ? 1100 : 650);
  }

  function hazirSec(i){
    const h = HAZIR[i];
    if(!h) return;
    akis.push({ kim:'sen', metin:h.ad });
    if(h.ozet){ cipler = null; const s = ozetSatirlari(); soyle(s.length ? (MODUL_AD[ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', s); return; }
    soyle(eylemCumlesi(h, h.cevap));
    ortam.zamanla(() => git(h), sesli ? 1100 : 650);
  }

  /* «Kolay gelsin. Hareket’i açıyorum.» — ne yapılacağını söyler (eylemsel). */
  function eylemCumlesi(h, cevap){
    const s = h && SAYFALAR.find(x => x.modul === h.modul && x.route === h.route);
    const yer = s ? s.ad + (h.modul !== (ayar && ayar.modul) ? ' (' + MODUL_AD[h.modul] + ')' : '') : '';
    return (cevap || 'Kolay gelsin.') + (yer ? ' ' + yer + ' açılıyor.' : '');
  }

  /* ------------------------------------------------------- görünüm */

  /* HİTAP (hesap › Profil, 2026-10-05): kullanıcı nasıl seslenilmesini
     yazdıysa öyle; yoksa görünen adı. Doğum gününde «İyi ki doğdun» —
     yalnız gerçek günde, başka hiçbir yerde. */
  function selam(){
    const t = ortam.simdi(), s = t.getHours();
    const o = (L.HESAP && L.HESAP.durum && L.HESAP.durum().oturum) || {};
    const ad = o.hitap || o.gorunen_ad || o.ad || '';
    const gun = String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    if(o.dogum_gun && o.dogum_gun === gun) return 'İyi ki doğdun' + (ad ? ' ' + ad : '') + '. Ne yapıyoruz?';
    const zaman = s < 5 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi günler' : 'İyi akşamlar';
    return zaman + (ad ? ' ' + ad : '') + '. Ne yapıyoruz?';
  }

  const KURE = '<span class="king__kure" aria-hidden="true"></span>';
  const NOKTA = m => '<i class="king__nokta king__nokta--' + (m || 'mer') + '" aria-hidden="true"></i>';

  /* PROFESYONEL (kullanıcı, 2026-10-05: «Apple Intelligence gibi olan King'i
     profesyonelleştir»): baloncuğun başında King ve bulunulan modül, sağda
     kapat; King'in cevabı avatar balonu değil düz yazı ve yalnız EN YENİSİ
     hafif bulanıktan netleşerek belirir; veri önizlemesi ayrı kart; hazır
     cevapta gideceği modülün noktası. */
  /* Söz 9: King hangi ekranda? Modülün rotası; adı katalogdan, yoksa sayfa başlığından. */
  function ekranAdi(){
    let r = null;
    try{ r = ayar && ayar.ekran ? ayar.ekran() : null; }catch(e){ r = null; }
    const s = r && SAYFALAR.find(x => x.modul === (ayar && ayar.modul) && x.route === r);
    if(s) return s.ad;
    const h = typeof document !== 'undefined' ? document.querySelector('#app h1, main h1') : null;
    return h ? String(h.textContent || '').trim().slice(0, 30) : '';
  }

  const SVG_BUYUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M10 19H5v-5M19 5l-6 6M5 19l6-6"/></svg>';
  const SVG_KAPAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';

  function miniGovde(){
    const son = akis.filter(m => m.kim === 'king' && !m.bekliyor).slice(-1)[0];
    const bekliyor = akis.some(m => m.bekliyor);
    const ekran = ekranAdi();
    const bas = '<div class="king__bas">' + KURE + '<b>King</b>'
      + '<span class="king__yer">' + NOKTA(ayar && ayar.modul) + kac(MODUL_AD[ayar && ayar.modul] || '') + (ekran ? ' · ' + kac(ekran) : '') + '</span>'
      + '<button type="button" class="king__kapat king__buyut" data-king="buyut" aria-label="Büyüt" title="Büyüt (Ctrl iki kez)">' + SVG_BUYUT + '</button>'
      + '<button type="button" class="king__kapat" data-king="kapat" aria-label="Kapat" title="Kapat (Esc)">' + SVG_KAPAT + '</button></div>';
    const govdeM = bekliyor
      ? '<div class="king__mini-son is-bekliyor" role="status" aria-label="King düşünüyor"><div class="king__dusun" aria-hidden="true"><i></i><i></i><i></i></div></div>'
      : '<div class="king__mini-son" aria-live="polite"><p>' + kac(son ? son.metin : 'Buradayım. Yaz ya da konuş.') + '</p>'
        + (son && son.satirlar && son.satirlar.length ? '<ul class="king__mini-liste">' + son.satirlar.slice(0, 5).map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : '')
        + (son && son.onizleme ? '<b class="king__mini-oz">' + kac(son.onizleme.metin) + '</b>' : '')
        + (son && son.son ? '<p class="king__mini-soru">' + kac(son.son) + '</p>' : '') + '</div>';
    const cip = cipler ? '<div class="king__cipler" role="group" aria-label="Cevaplar">' + cipler.map(c => '<button type="button" class="king__cip'
      + (c.is === 'kaydet' || c.is === 'ilet' || /^foto:0$/.test(c.is) || (c.is === 'foto-yorum' && !/foto:0/.test(JSON.stringify(cipler))) ? ' king__cip--ana' : '') + '" data-king="' + c.is + '">' + kac(c.ad) + '</button>').join('') + '</div>' : '';
    const mik = ortam.tanima()
      ? '<button type="button" class="king__mik' + (dinleyen ? ' is-acik' : '') + '" data-king="dinle" aria-pressed="' + (dinleyen ? 'true' : 'false')
        + '" aria-label="' + (dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor') + '"><svg viewBox="0 0 24 24" aria-hidden="true">'
        + '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>' : '';
    return bas + (paylasim ? '<div class="king__paylasim" role="status"><i class="king__canli" aria-hidden="true"></i>Ekran paylaşılıyor · sorduğunda görürüm'
      + '<button type="button" class="king__paylasim-dur" data-king="paylasim-bitir">Durdur</button></div>' : '') + govdeM + cip
      + '<form class="king__yaz" data-king-form data-ayar-disi>'
      + '<input class="king__girdi" type="text" aria-label="King\'e yaz" placeholder="' + (dinleyen ? 'Dinliyorum…' : 'King\'e yaz…') + '" autocomplete="off" enterkeyhint="send"/>'
      + '<label class="king__foto-dugme" title="Fotoğraf gönder (Ctrl+V ile yapıştır, sürükleyip bırak da olur)" aria-label="Fotoğraf gönder">'
      + '<input type="file" accept="image/*" data-king-dosya class="sr-only"/>'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.6-2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></label>' + mik + '<button type="submit" class="king__gonder" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button></form>';
  }

  function govde(){
    if(mini) return miniGovde();
    const satirlar = akis.length ? akis : [{ kim:'king', metin:selam(), yeni:true }];
    const bas = '<div class="king__bas">' + KURE + '<b>King</b>'
      + '<span class="king__yer">' + NOKTA(ayar && ayar.modul) + kac(MODUL_AD[ayar && ayar.modul] || '') + '</span>'
      + '<span class="king__durum" title="' + (baglanti() ? 'Sorular Merkez’deki King’e (yapay zekâ) gider'
        : gorselZincir().length ? 'Merkez bağlı değil; sorulara yerel kurallarla, ekran ve fotoğrafa görüntü okuyan modelle cevap verir'
        : 'Merkez bağlı değil: King yerel kurallarla cevaplar') + '">'
      + (baglanti() ? 'yapay zekâ' : gorselZincir().length ? 'görüntü açık' : 'yerel') + '</span>'
      + '<button type="button" class="king__kapat king__ekran' + (paylasim ? ' is-acik' : '') + '" data-king="' + (paylasim ? 'paylasim-bitir' : 'paylas')
      + '" aria-pressed="' + (paylasim ? 'true' : 'false') + '" aria-label="' + (paylasim ? 'Ekran paylaşımını durdur' : 'Ekranımı paylaş')
      + '" title="' + (paylasim ? 'Ekran paylaşımını durdur' : 'Ekranımı paylaş: bir ekran, pencere ya da sekme seç; sorduğunda King o anki ekranı görür') + '">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="11.5" rx="2"/><path d="M9 20h6M12 16.5V20M12 13.5V8M9.5 10.5L12 8l2.5 2.5"/></svg></button>'
      + '<button type="button" class="king__kapat king__sayfa" data-king="ekran" aria-label="Bu sayfayı göster" title="Bu sayfayı göster: King bulunduğun LifeOS sayfasını okur'
      + (baglanti() ? '; sayfadaki yazılar Merkez’deki King’e gider' : '') + '">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg></button>'
      + (ortam.tanima() ? '<button type="button" class="king__kapat king__sohbet' + (sesliSohbet ? ' is-acik' : '') + '" data-king="sohbet" aria-pressed="'
        + (sesliSohbet ? 'true' : 'false') + '" aria-label="Sesli sohbet" title="Sesli sohbet: King konuşunca yeniden dinler; «tamam» de, biter">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg></button>' : '')
      + '<button type="button" class="king__kapat king__kucult" data-king="kucult" aria-label="Küçült" title="Küçült: sayfayı kullanırken açık kalır">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5l-6 6M14 11h-3V8M5 19l6-6M10 13h3v3"/></svg></button>'
      + '<button type="button" class="king__kapat" data-king="kapat" aria-label="Kapat" title="Kapat (Esc)">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>';
    const balonlar = satirlar.map(m => m.kim === 'sen'
      ? (m.foto ? '<div class="king__balon king__balon--sen king__balon--foto"><img class="king__foto" src="' + kac(m.foto) + '" alt="Gönderdiğin fotoğraf"/></div>'
        : '<div class="king__balon king__balon--sen"><p>' + kac(m.metin) + '</p></div>')
      : m.bekliyor
      ? '<div class="king__balon king__balon--king is-bekliyor" role="status" aria-label="King düşünüyor">'
        + '<div class="king__dusun" aria-hidden="true"><i></i><i></i><i></i></div></div>'
      : '<div class="king__balon king__balon--king' + (m.yeni ? ' is-yeni' : '') + '"><div><p>' + kac(m.metin) + '</p>'
        + (m.onizleme
          ? '<div class="king__onizle"><span class="king__onizle-ad">Eklenecek</span>'
            + (m.onizleme.liste ? '<ul class="king__liste">' + m.onizleme.liste.map(x => '<li><b>' + kac(x) + '</b></li>').join('') + '</ul>'
              : '<b>' + kac(m.onizleme.metin) + '</b>')
            + (m.onizleme.ipucu ? '<small>' + kac(m.onizleme.ipucu) + '</small>' : '') + '</div>'
          : (m.satirlar && m.satirlar.length ? '<ul>' + m.satirlar.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : ''))
        + (m.son ? '<p class="king__son">' + kac(m.son) + '</p>' : '')
        + '</div></div>').join('');
    const cip = cipler
      ? cipler.map(c => '<button type="button" class="king__cip' + (c.is === 'kaydet' || c.is === 'ilet' || /^foto:0$/.test(c.is) || (c.is === 'foto-yorum' && !/foto:0/.test(JSON.stringify(cipler))) ? ' king__cip--ana' : '')
          + '" data-king="' + c.is + '">' + kac(c.ad) + '</button>').join('')
      /* Profesyonel (2026-10-16): hazır cevaplar yalnız boş sohbette; konuşma
         başlayınca gürültü olmasın. */
      : akis.length ? '' : HAZIR.map((h, i) => ({ h, i })).sort((a, b) => (a.h.ozet - b.h.ozet)
          || ((b.h.modul === (ayar && ayar.modul)) - (a.h.modul === (ayar && ayar.modul))) || a.i - b.i)
          .map(({ h, i }) => '<button type="button" class="king__cip" data-king-hazir="' + i + '">'
          + NOKTA(h.ozet ? (ayar && ayar.modul) : h.modul) + kac(h.ad) + '</button>').join('');
    const mik = ortam.tanima()
      ? '<button type="button" class="king__mik' + (dinleyen ? ' is-acik' : '') + '" data-king="dinle" aria-pressed="'
        + (dinleyen ? 'true' : 'false') + '" aria-label="' + (dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor')
        + '" title="Konuşarak sor · tanımayı tarayıcı yapar"><svg viewBox="0 0 24 24" aria-hidden="true">'
        + '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>'
      : '';
    return bas + (paylasim ? '<div class="king__paylasim" role="status"><i class="king__canli" aria-hidden="true"></i>Ekran paylaşılıyor · sorduğunda görürüm'
      + '<button type="button" class="king__paylasim-dur" data-king="paylasim-bitir">Durdur</button></div>' : '') + '<div class="king__akis" aria-live="polite">' + balonlar + '</div>'
      + '<div class="king__cipler" role="group" aria-label="Hazır cevaplar">' + cip + '</div>'
      + '<form class="king__yaz" data-king-form data-ayar-disi>'
      + '<input class="king__girdi" type="text" aria-label="King\'e yaz" placeholder="' + (dinleyen ? 'Dinliyorum…' : 'King\'e yaz ya da konuş…') + '" autocomplete="off" enterkeyhint="send"/>'
      + '<label class="king__foto-dugme" title="Fotoğraf gönder (Ctrl+V ile yapıştır, sürükleyip bırak da olur)" aria-label="Fotoğraf gönder">'
      + '<input type="file" accept="image/*" data-king-dosya class="sr-only"/>'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.6-2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></label>' + mik
      + '<button type="submit" class="king__gonder" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button></form>'
      + '<p class="king__ipucu" aria-hidden="true">' + (ortam.tanima() ? 'Mikrofona dokun ve konuş · ' : '') + 'Enter gönderir · Esc kapatır</p>';
  }

  function ciz(odak){
    if(typeof document === 'undefined') return;
    const k = document.querySelector('[data-king]');
    if(!k) return;
    const kutu = k.querySelector('.king__kutu');
    kutu.innerHTML = govde();
    const g = kutu.querySelector('.king__girdi');
    const akisEl = kutu.querySelector('.king__akis');
    if(akisEl) akisEl.scrollTop = akisEl.scrollHeight;
    akis.forEach(m => { m.yeni = false; });
    durum();
    if(odak !== false && g && !(mini && odak !== true) && !(L.KABUK && L.KABUK.telefonMu && L.KABUK.telefonMu())){
      try{ g.focus({ preventScroll:true }); }catch(e){ /* odak yok */ }
    }
  }

  function ac(o){
    if(typeof document === 'undefined' || !document.body || !ayar) return;
    if(L.KABUK && L.KABUK.katmanAcik && L.KABUK.katmanAcik()) L.KABUK.katmanKapat();
    if(acik){ if(mini && !(o && o.mini)) buyut(); const g = document.querySelector('.king__girdi'); if(g) try{ g.focus(); }catch(e){} return; }
    acik = true;
    mini = !!(o && o.mini);
    akis = (o && Array.isArray(o.onceki) && o.onceki.length)
      ? o.onceki.filter(m => m && m.metin).map(m => ({ kim:m.kim === 'sen' ? 'sen' : 'king', metin:String(m.metin) }))
      : geriGetir();
    cipler = null; bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenFoto = null; sesli = false;
    if(o && o.mesaj) akis.push({ kim:'king', metin:o.mesaj });
    const el = document.createElement('div');
    el.className = 'king';
    el.setAttribute('data-king', '');
    /* Perde: arka plan hafifçe kararır (odak baloncukta); dokununca kapanır. */
    el.innerHTML = '<div class="king-perde" aria-hidden="true"></div><div class="king-isik" aria-hidden="true"></div>'
      + '<div class="king__kutu" role="dialog" aria-modal="false" aria-label="King ile konuş"></div>';
    if(mini) el.classList.add('is-mini');
    document.body.appendChild(el);
    tasimaYaz();
    document.documentElement.classList.add(mini ? 'king-mini' : 'king-acik');
    ciz(mini ? false : undefined);
    /* Odak katmanı: soldaki kenar King'i açan tıkla uyanmış olabilir;
       hareketsiz ve sakin kalır (kabuk.js «sakin kenar»). */
    if(L.KABUK && typeof L.KABUK.kenarSakinlestir === 'function'){ try{ L.KABUK.kenarSakinlestir(); }catch(e){ /* kabuk yok */ } }
    /* Bir kare sonra: geçiş başlasın (ışık süzülür, baloncuk yükselir). */
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-acik')));
  }

  /* Söz 9: küçük kutu. Perde ve ışık yok, sayfa kullanılır; kabuğun
     «King açık» kilidi (king-acik) kalkar. */
  function kucult(){
    if(!acik || mini || typeof document === 'undefined') return;
    mini = true;
    const el = document.querySelector('[data-king]');
    if(el) el.classList.add('is-mini');
    document.documentElement.classList.remove('king-acik');
    document.documentElement.classList.add('king-mini');
    ciz(false);
    tasimaYaz();
  }
  function buyut(){
    if(!acik || !mini || typeof document === 'undefined') return;
    mini = false;
    const el = document.querySelector('[data-king]');
    if(el) el.classList.remove('is-mini');
    document.documentElement.classList.remove('king-mini');
    document.documentElement.classList.add('king-acik');
    ciz();
  }
  /* Modül: ekran değişti (go). Küçük kutunun başlığı tazelenir; odak çalınmaz. */
  function ekranDegisti(){ if(acik && mini) ciz(false); }

  function kapat(){
    if(!acik || typeof document === 'undefined') return;
    acik = false;
    mini = false;
    sesliSohbet = false; bekleyenFoto = null;
    ortam.depo.sil(TASIMA);
    if(paylasim){ const p = paylasim; paylasim = null; try{ p.bitir(); }catch(e){ /* durmuş */ } }
    if(dinleyen){ try{ dinleyen.abort ? dinleyen.abort() : dinleyen.stop(); }catch(e){ /* kapalı */ } dinleyen = null; }
    /* Sayfaya giderken söylenen cümle yarıda kesilmesin; elle kapatınca susar. */
    if(!sesli) sus();
    const el = document.querySelector('[data-king]');
    if(!el) return;
    el.classList.remove('is-acik');
    el.classList.add('is-kapaniyor');
    document.documentElement.classList.remove('king-acik');
    document.documentElement.classList.remove('king-mini');
    setTimeout(() => el.remove(), 360);
  }

  /* ------------------------------------------------------- olaylar */

  let bagli = false, sonCtrl = 0, baskaTus = false, basili = null;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && acik){ e.preventDefault(); sesli = false; kapat(); return; }
      if(e.key !== 'Control'){ baskaTus = true; return; }
      if(e.repeat) return;
      const s = Date.now();
      if(!baskaTus && s - sonCtrl < 400){ sonCtrl = 0; !acik ? ac() : mini ? buyut() : kapat(); return; }
      sonCtrl = s;
      baskaTus = false;
    }, true);
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      if(t.closest('[data-king-ac]')){ e.preventDefault(); e.stopPropagation(); ac(); return; }
      /* Söz 9: perde ve dışarısı KAPATMAZ, küçültür; küçükken sayfa serbest. */
      if(t.closest('.king-perde')){ e.preventDefault(); e.stopPropagation(); kucult(); return; }
      const k = t.closest('[data-king]');
      if(!k){ if(acik && !mini) kucult(); return; }
      const h = t.closest('[data-king-hazir]');
      if(h){ hazirSec(Number(h.getAttribute('data-king-hazir'))); return; }
      const c = t.closest('[data-king]:not(.king)');
      if(c){
        const is = c.getAttribute('data-king');
        if(is === 'kapat'){ sesli = false; kapat(); return; }
        if(is === 'dinle'){ dinle(); return; }
        if(is === 'kucult'){ kucult(); return; }
        if(is === 'buyut'){ buyut(); return; }
        if(is === 'ilet'){ ilet(); return; }
        if(is === 'ekran'){ ekranGoster(); return; }
        if(is === 'paylas'){ paylasimBaslat(); return; }
        if(is === 'paylasim-bitir'){ paylasimBitir(); return; }
        if(is === 'foto-yorum'){ fotoYorumla(); return; }
        if(is === 'sohbet'){ sesliSohbetAc(); ciz(false); return; }
        if(is === 'geri-al'){ geriAlYap(); return; }
        if(/^foto:\d+$/.test(is)){ fotoIsle(Number(is.slice(5))); return; }
        if(is === 'kaydet') kaydet();
        else if(is === 'git-onay') gitOnayla();
        else if(is === 'vazgec') vazgec();
      }
    }, true);
    /* Söz 11: fotoğraf — düğme, yapıştır, sürükle-bırak. */
    document.addEventListener('change', e => {
      const d = e.target && e.target.matches && e.target.matches('[data-king-dosya]') ? e.target : null;
      if(!d) return;
      const f = d.files && d.files[0];
      if(f) fotoAl(f);
      d.value = '';
    }, true);
    document.addEventListener('paste', e => {
      if(!acik || !e.target || !e.target.closest || !e.target.closest('[data-king]')) return;
      const it = Array.from((e.clipboardData && e.clipboardData.items) || []).find(x => /^image\//.test(x.type));
      const f = it && it.getAsFile ? it.getAsFile() : null;
      if(f){ e.preventDefault(); fotoAl(f); }
    }, true);
    document.addEventListener('dragover', e => {
      if(acik && e.target && e.target.closest && e.target.closest('.king__kutu')) e.preventDefault();
    }, true);
    document.addEventListener('drop', e => {
      if(!acik || !e.target || !e.target.closest || !e.target.closest('.king__kutu')) return;
      const f = Array.from((e.dataTransfer && e.dataTransfer.files) || []).find(x => /^image\//.test(x.type));
      if(f){ e.preventDefault(); fotoAl(f); }
    }, true);
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-form]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('.king__girdi');
      const m = g ? g.value : '';
      if(g) g.value = '';
      sesli = false;            // yazıyla sorulana yazıyla
      sus();
      isle(m);
    });
    /* Telefonda «+»ya basılı tutmak: King. */
    document.addEventListener('pointerdown', e => {
      const p = e.target && e.target.closest ? e.target.closest('.hizliekle') : null;
      if(!p) return;
      basili = setTimeout(() => { basili = 'oldu'; ac(); }, 450);
    }, true);
    const birak = e => {
      if(basili === 'oldu'){ basili = null; if(e && e.type === 'pointerup') e.preventDefault(); return; }
      if(basili){ clearTimeout(basili); basili = null; }
    };
    document.addEventListener('pointerup', birak, true);
    document.addEventListener('pointercancel', birak, true);
    document.addEventListener('click', e => {
      if(basili === 'oldu' && e.target && e.target.closest && e.target.closest('.hizliekle')){
        e.preventDefault(); e.stopPropagation(); basili = null;
      }
    }, true);
  }

  /* Modülün tek çağrısı (app.js, model yüklendikten sonra). Başka bir
     modülden King'le gelindiyse (#king=rota[:sekme]) oraya gidilir. */
  function kur(o){
    ayar = Object.assign({ modul:'spi' }, o || {});
    bagla();
    /* Söz 18: başka modülden King açık gelindiyse burada küçük kutu olarak
       sohbetiyle açılır; kendi modülünün eski taşıması yalnız silinir. */
    const ts = ortam.depo.oku(TASIMA);
    if(ts) ortam.depo.sil(TASIMA);
    const tasindi = !!(ts && ts.acik && ts.kaynak && ts.kaynak !== ayar.modul
      && Date.now() - (Number(ts.zaman) || 0) < 12 * 3600 * 1000);
    const onceki = tasindi && Array.isArray(ts.akis) ? ts.akis : null;
    let hedef = null;
    const m = String(ortam.hash() || '').match(/^#king=([a-z]+)(?::([a-z]+))?$/);
    if(m){ ortam.hashSil(); hedef = { route:m[1], sekme:m[2] || null }; }
    else if(tasindi && ts.git && typeof ts.git.route === 'string') hedef = { route:ts.git.route, sekme:ts.git.sekme || null };
    if(hedef && gecerliRota(ayar.modul, hedef.route)){
      ortam.zamanla(() => {
        try{ ayar.git(hedef.route, hedef.sekme ? { sekme:hedef.sekme } : {}); }catch(e){ console.error('King:', e); }
        /* Söz 9: King'le gelindi; burada küçük kutu olarak açık kalır. */
        const s = SAYFALAR.find(x => x.modul === ayar.modul && x.route === hedef.route);
        ac({ mini:true, onceki, mesaj:'Buradayım. ' + (s ? s.ad + ' açık; ' : '') + 'yaptığını yaz, kaydedeyim.' });
      }, 60);
      return;
    }
    if(tasindi) ortam.zamanla(() => ac({ mini:true, onceki, mesaj:MODUL_AD[ayar.modul] + '’ye geçtik, buradayım.' }), 60);
  }

  function _sifirla(){
    if(typeof document !== 'undefined'){
      const el = document.querySelector('[data-king]');
      if(el) el.remove();
      document.documentElement.classList.remove('king-acik');
      document.documentElement.classList.remove('king-mini');
    }
    if(ayar) ortam.depo.sil(depoAnahtar());
    ortam.depo.sil(TASIMA);
    ayar = null; acik = false; mini = false; akis = []; bekleyenFoto = null; sonGeriAl = null; sesliSohbet = false; sessizSay = 0; cipler = null; bekleyen = null; bekleyenGit = null; bekleyenIlet = null;
    sesli = false; dinleyen = null; konusuyor = 0;
  }

  return {
    kur, ac, kapat, kucult, buyut, ekranDegisti, yorumla, isle, hazirSec, kaydet, dinle, sesSec, veriGibi,
    fotoAl, fotoIsle, ekranOku, ekranGoster, sesliSohbetAc, geriAlYap, sesliSohbetMi:() => sesliSohbet,
    paylasimBaslat, paylasimBitir, paylasimVar:() => !!paylasim, fotoYorumla, GORSEL_SISTEM, TASIMA,
    acikMi:() => acik, miniMi:() => mini, akis:() => akis.slice(),
    SAYFALAR, HAZIR, _ortam:ortam, _sifirla,
  };
})();
