/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/kilavuz.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* KULLANIM KILAVUZU — ilk gün, her gün, sistemler, telefon (kullanıcı, 2026-11-05:
   «karmaşık olmasın, anlaşılabilir olsun, sistemin bir yerine güzel bir şekilde eklensin»).

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/kilavuz.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne birebir kopyalanır. Biçimi `kilavuz.css`,
   testi `kilavuz.test.js`.
   ==================================================================

   Her adım boş veriyle gerçek uygulamada yürütülerek yazıldı. Ekran adı ya da
   düğme yazısı değişirse burası da değişir: «Çalışma › Deneme» gibi yollar
   `kilavuz.test.js`te her modülün gerçek menüsüyle karşılaştırılır.
   Sayfa Ayarlar çekmecesinde durur; Menü'nün başındaki satır (kabuk.js) ve
   komut paleti de buraya açar. Modül yalnız `KILAVUZ.kur` satırını yazar. */
window.LIFEOS.PARCA.yazilar({
  'ortak.kilavuz.baslik':'Kullanım kılavuzu',
  'ortak.kilavuz.menu':'Kılavuz',
  'ortak.kilavuz.komut':'Kullanım kılavuzu',
  'ortak.kilavuz.ozet.kurulum':'Kurulum',
  'ortak.kilavuz.ozet.kurulum-sure':'yaklaşık 10 dakika',
  'ortak.kilavuz.ozet.gun':'Her gün',
  'ortak.kilavuz.ozet.gun-sure':'yaklaşık 3 dakika',
  'ortak.kilavuz.ozet.tahmin':'tahmin',

  'ortak.kilavuz.ilk.baslik':'İlk gün',
  'ortak.kilavuz.ilk.1.ad':'LifeOS’u aç',
  'ortak.kilavuz.ilk.1.metin':'Masaüstündeki LifeOS simgesine çift tıkla. Giriş sayfası gelir.',
  'ortak.kilavuz.ilk.2.ad':'Giriş yap',
  'ortak.kilavuz.ilk.2.metin':'Hesabın yoksa «Hesap oluştur»a bas. Şifreni unutursan diye kendine bir soru da yazarsın.',
  'ortak.kilavuz.ilk.3.ad':'Bir sistem seç',
  'ortak.kilavuz.ilk.3.metin':'AYS, SPİ ve ESP kartlarındaki «Aç» düğmesine bas. Üçünü aynı gün kurman gerekmez.',
  'ortak.kilavuz.ilk.4.ad':'Soruları yanıtla',
  'ortak.kilavuz.ilk.4.metin':'Her sistem ilk açılışta birkaç soru sorar:',
  'ortak.kilavuz.ilk.5.ad':'İlk kaydını gir',
  'ortak.kilavuz.ilk.5.metin':'Bugün ekranındaki «Ne yaptın?» kutusuna bir cümle yaz, Enter’a bas. Sistem ne anladığını gösterir; doğruysa «Kaydet»e bas.',
  'ortak.kilavuz.kur.ays.adim':'AYS · 5 adım',
  'ortak.kilavuz.kur.ays.metin':'Takvimde «Hemen bugünden»i seç. Hedef başarı sırası boşsa plan üretilmez.',
  'ortak.kilavuz.kur.spi.adim':'SPİ · 3 adım',
  'ortak.kilavuz.kur.spi.metin':'Ad, doğum yılı, boy ve kilo gerekir. İstersen «Şimdilik atla».',
  'ortak.kilavuz.kur.esp.adim':'ESP · 3 adım',
  'ortak.kilavuz.kur.esp.metin':'Yalnız ad gerekir. İstersen «Şimdilik atla».',

  'ortak.kilavuz.gun.baslik':'Her gün',
  'ortak.kilavuz.gun.1.vakit':'Sabah',
  'ortak.kilavuz.gun.1.ad':'Bugün’e bak',
  'ortak.kilavuz.gun.1.metin':'Sayfanın başı sıradaki işi söyler.',
  'ortak.kilavuz.gun.2.vakit':'Gün içinde',
  'ortak.kilavuz.gun.2.ad':'«Ne yaptın?»a yaz',
  'ortak.kilavuz.gun.2.metin':'Yaptığını tek cümleyle yaz, «Kaydet»e bas.',
  'ortak.kilavuz.gun.3.vakit':'Akşam',
  'ortak.kilavuz.gun.3.ad':'«Günü kapat»a bas',
  'ortak.kilavuz.gun.3.metin':'Doğru olanı onayla, ölçtüğünü yaz, kaydet. SPİ’de düğmenin adı «Günü kaydet».',
  'ortak.kilavuz.gun.not':'Üç sistemi tek sayfada görmek için giriş sayfasındaki «Gün»ü aç.',

  'ortak.kilavuz.sistem.baslik':'Sistemler',
  'ortak.kilavuz.yaz':'Yaz:',
  'ortak.kilavuz.ays.tur':'Sınav',
  'ortak.kilavuz.ays.ornek':'matematikten 40 soru çözdüm',
  'ortak.kilavuz.ays.hafta':'Bu haftanın planı',
  'ortak.kilavuz.ays.deneme':'Deneme sonuçların',
  'ortak.kilavuz.ays.konular':'Konuyu burada öğren',
  'ortak.kilavuz.ays.ilerleme':'Netlerinin gidişi',
  'ortak.kilavuz.spi.tur':'Sağlık',
  'ortak.kilavuz.spi.ornek':'7 saat uyudum, 2 yumurta yedim',
  'ortak.kilavuz.spi.genel':'Uyku, nabız, kilo, su ve öğünler',
  'ortak.kilavuz.spi.hareket':'Antrenman ve yürüyüş',
  'ortak.kilavuz.spi.testler':'Tahlil sonuçların',
  'ortak.kilavuz.spi.sinir':'SPİ teşhis koymaz, ilaç önermez. Karar hekimindir.',
  'ortak.kilavuz.esp.tur':'Gelişim',
  'ortak.kilavuz.esp.ornek':'45 dk gitar, 20 dakika kelime',
  'ortak.kilavuz.esp.dil':'Kelime kartları ve tekrar',
  'ortak.kilavuz.esp.okuma':'Okuduğun kitaplar',
  'ortak.kilavuz.esp.merdiven':'Her alanda geldiğin basamak',
  'ortak.kilavuz.esp.sinir':'ESP sertifika vermez, yetenek yargısı kurmaz.',

  'ortak.kilavuz.king.tur':'Yardımcı',
  'ortak.kilavuz.king.ac':'Kenardaki «King»e bas ya da Ctrl’e iki kez dokun. Telefonda Bugün’deki «King’e sor»a dokun.',
  'ortak.kilavuz.king.1':'kilo 74 yaz',
  'ortak.kilavuz.king.1.not':'Önce sorar, «Evet, ekle» dersen yazar.',
  'ortak.kilavuz.king.2':'öğün ekranını aç',
  'ortak.kilavuz.king.2.not':'Ekranı açar.',
  'ortak.kilavuz.king.3':'bugün ne yapmalıyım?',
  'ortak.kilavuz.king.3.not':'Günün durumunu söyler.',
  'ortak.kilavuz.king.sinir':'Sayıları sistem hesaplar; King sayı uydurmaz. Serbest sohbet için Ayarlar › Merkez açık olmalı; kapalıyken yukarıdaki gibi kısa komutları anlar.',

  'ortak.kilavuz.tel.baslik':'Telefon',
  'ortak.kilavuz.tel.1':'Telefon ve bilgisayar aynı Wi-Fi’da, bilgisayarda LifeOS açık olsun.',
  'ortak.kilavuz.tel.2':'Bilgisayarda Ayarlar › Hesap › Bağlantılar › Yeni cihaz bağla › Aç. Altı haneli kod 5 dakika geçerlidir.',
  'ortak.kilavuz.tel.3':'Telefonda LifeOS’u aç, «Kodla bağlan»a dokun; bilgisayarın adresini ve kodu yaz.',
  'ortak.kilavuz.tel.not':'Adres bilgisayarda Ayarlar › Hesap › Oturum açık cihazlar’da yazar. Dışarıda girdiğin kayıt eve dönünce eşitlenir; fotoğraflar çekildiği cihazda kalır.',

  'ortak.kilavuz.tak.baslik':'Takılırsan',
  'ortak.kilavuz.tak.bul':'Ekranı bulamadın',
  'ortak.kilavuz.tak.bul.not':'Menü’ye bak ya da Ctrl K ile ara.',
  'ortak.kilavuz.tak.yanlis':'Yanlış kayıt girdin',
  'ortak.kilavuz.tak.yanlis.not':'Ekranda «Geri al» belirir; sonra o kaydın ekranından düzelt.',
  'ortak.kilavuz.tak.sifre':'Şifreni unuttun',
  'ortak.kilavuz.tak.sifre.not':'Giriş ekranında «Şifremi unuttum»a bas, kendi sorunu yanıtla.',
});

window.LIFEOS.KILAVUZ = (function(){
  const P = window.LIFEOS.PARCA, yz = P.yazi;
  const k = id => yz('ortak.kilavuz.' + id);
  const kac = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  const AYIRAC = ' › ';

  /* Yollar kullanıcının menüde gördüğü adlardır (çekmece › bölüm); test menüyle karşılaştırır. */
  const SISTEMLER = Object.freeze([
    { id:'ays', ad:'AYS', yollar:[['Plan', 'Hafta', 'ays.hafta'], ['Çalışma', 'Deneme', 'ays.deneme'], ['Öğren', 'Konular', 'ays.konular'], ['Analiz', 'İlerleme', 'ays.ilerleme']] },
    { id:'spi', ad:'SPİ', yollar:[['Bugün', 'Genel bakış', 'spi.genel'], ['Çalışma', 'Hareket', 'spi.hareket'], ['Çalışma', 'Testler', 'spi.testler']], sinir:'spi.sinir' },
    { id:'esp', ad:'ESP', yollar:[['Çalışma', 'Dil', 'esp.dil'], ['Çalışma', 'Okuma', 'esp.okuma'], ['Plan', 'Merdiven', 'esp.merdiven']], sinir:'esp.sinir' },
  ]);

  const bolum = (ad, govde) => '<section class="kilavuz__bolum"><h2 class="kilavuz__baslik">' + kac(ad) + '</h2>' + govde + '</section>';
  const adimlar = l => '<ol class="kilavuz__adimlar">' + l.map((a, i) => '<li class="kilavuz__adim"><span class="kilavuz__no" aria-hidden="true">' + (i + 1) + '</span><div>' + a + '</div></li>').join('') + '</ol>';
  const adMetin = (ad, metin, ek) => '<b>' + kac(k(ad)) + '</b><p>' + kac(k(metin)) + '</p>' + (ek || '');
  const satirlar = l => '<dl class="kilavuz__satirlar">' + l.map(([d, a]) => '<div><dt>' + kac(d) + '</dt><dd>' + kac(a) + '</dd></div>').join('') + '</dl>';

  function ozetHtml(){
    const hucre = (ad, sure) => '<div><span>' + kac(k(ad)) + '</span><b>' + kac(k(sure)) + '</b><small>' + kac(k('ozet.tahmin')) + '</small></div>';
    /* Kabuğun başlığı çekmece adıdır («Ayarlar»); sayfanın adı burada. */
    return '<h2 class="kilavuz__ad">' + kac(k('baslik')) + '</h2><div class="kilavuz__ozet">' + hucre('ozet.kurulum', 'ozet.kurulum-sure') + hucre('ozet.gun', 'ozet.gun-sure') + '</div>'
      /* Spot ışıklı tur buradan yeniden başlar (ortak/patrontur.js). */
      + '<p><button type="button" class="btn btn--ghost btn--sm" data-patrontur-ac>' + kac(yz('ortak.patrontur.yeniden')) + '</button> '
      /* Otomatik: dokunmadan izlenir, menüler kendi açılır (kullanıcı, 2026-11-07). */
      + '<button type="button" class="btn btn--ghost btn--sm" data-patrontur-ac="oto">' + kac(yz('ortak.patrontur.oto-izle')) + '</button></p>';
  }

  function ilkGunHtml(){
    const kurulum = satirlar(['ays', 'spi', 'esp'].map(m => [k('kur.' + m + '.adim'), k('kur.' + m + '.metin')]));
    return bolum(k('ilk.baslik'), adimlar([1, 2, 3, 4, 5].map(n => adMetin('ilk.' + n + '.ad', 'ilk.' + n + '.metin', n === 4 ? kurulum : ''))));
  }

  function herGunHtml(){
    const vakit = [1, 2, 3].map(n => '<li><span>' + kac(k('gun.' + n + '.vakit')) + '</span>' + adMetin('gun.' + n + '.ad', 'gun.' + n + '.metin') + '</li>').join('');
    return bolum(k('gun.baslik'), '<ol class="kilavuz__gun">' + vakit + '</ol><p class="kilavuz__not">' + kac(k('gun.not')) + '</p>');
  }

  function kart(id, ad, tur, govde){
    return '<article class="kilavuz__kart" data-kilavuz-kart="' + id + '"><h3><i class="kilavuz__isaret kilavuz__isaret--' + id + '" aria-hidden="true"></i>' + kac(ad)
      + '<small>' + kac(tur) + '</small></h3>' + govde + '</article>';
  }
  const ornek = m => '<p class="kilavuz__ornek"><span>' + kac(k('yaz')) + '</span> ' + kac(k(m + '.ornek')) + '</p>';

  function sistemlerHtml(){
    const kartlar = SISTEMLER.map(s => kart(s.id, s.ad, k(s.id + '.tur'), ornek(s.id)
      + satirlar(s.yollar.map(([c, b, m]) => [c + AYIRAC + b, k(m)]))
      + (s.sinir ? '<p class="kilavuz__not">' + kac(k(s.sinir)) + '</p>' : '')));
    const king = kart('king', 'King', k('king.tur'), '<p>' + kac(k('king.ac')) + '</p>'
      + satirlar([1, 2, 3].map(n => ['«' + k('king.' + n) + '»', k('king.' + n + '.not')]))
      + '<p class="kilavuz__not">' + kac(k('king.sinir')) + '</p>');
    return bolum(k('sistem.baslik'), '<div class="kilavuz__kartlar">' + kartlar.join('') + king + '</div>');
  }

  function telefonHtml(){
    return bolum(k('tel.baslik'), adimlar([1, 2, 3].map(n => '<p>' + kac(k('tel.' + n)) + '</p>')) + '<p class="kilavuz__not">' + kac(k('tel.not')) + '</p>');
  }

  function takilirsanHtml(){
    return bolum(k('tak.baslik'), satirlar(['bul', 'yanlis', 'sifre'].map(t => [k('tak.' + t), k('tak.' + t + '.not')])));
  }

  let modul = null;
  /* Modül çağırır (screens/guide.js): sayfa, ekran ve komut buradan kaydedilir. ns: R, SP ya da ESP. */
  function kur(m, ns){
    modul = m;
    P.sayfa({ id:'kilavuz', modul:m, cekmece:'ayarlar', ad:k('menu'), sira:40 });
    [['ozet', ozetHtml], ['ilk', ilkGunHtml], ['gun', herGunHtml], ['sistemler', sistemlerHtml], ['telefon', telefonHtml], ['takilirsan', takilirsanHtml]].forEach(([id, ciz], i) =>
      P.blok({ id:'kilavuz.' + id, sayfa:'kilavuz', yer:'ana', ad:k('baslik'), sira:(i + 1) * 10, ciz }));
    /* SPİ ve ESP paleti menüden üretir; AYS'ninki elle yazılır. */
    if(m === 'ays') P.komut({ modul:m, sira:195, group:'Git', label:k('komut'), icon:'guide', route:'kilavuz', run(){ ns.App.go('kilavuz'); } });
    ns.Screens.kilavuz = {
      id:'kilavuz', title:k('baslik'),
      subtitle(){ return ''; }, lede(){ return ''; }, actions(){ return ''; },
      render(){ return '<div class="kilavuz">' + P.liste('kilavuz', 'ana', ns.C).join('') + '</div>'; },
      handle:{}, change:{},
    };
  }

  return Object.freeze({ kur, SISTEMLER, AYIRAC, modul:() => modul });
})();
