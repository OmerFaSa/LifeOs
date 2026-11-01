/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/king-kart.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* KING · kartlar: araç vitrini, kartlarım, kütüphane, soru kartları, araştırma kartı, biçim.
   Parça 5/8; yükleme sırası: king.js, king-ses.js, king-kayit.js, king-gorunum.js, king-kart.js, king-arac.js, king-devrim.js, king-yol.js.
   Dosyalar arası ortak adlar ve ortak durum window.LIFEOS.KING_IC'tedir (KI.ad). */

(function(){
  'use strict';

  const KI = window.LIFEOS.KING_IC;

  /* ARAÇLAR (kullanıcı, 2026-10-22: «King'in özelliklerinin hepsini oradan
     görebilirim ki aklımızda tutmak yerine»). King'in yapabildiği her şey
     tek listede, gruplu ve aranır. Katalog UYDURULMAZ: her satırın örneği
     King'in gerçek tetiğidir (KART_SORU, ODAK_RE, NOT_RE, HAFTA_RE …; testi
     king.test.js «araçlar»), koşulu sağlanmayan satır hiç çizilmez (bankası
     olmayan modülde «Bana soru sor» yok). Üç tür satır:
       calis   dokununca hemen sorulur (yalnız okuyan komutlar)
       doldur  örnek yazı alanına konur, gönderilmez (söz 37 kuralı)
       is      var olan eylem (kamera, PDF, görev panosu, Beni nasıl tanıyorsun)
     Merkez isteyen satır bağlı değilken «Merkez» etiketiyle söner; yine
     dokunulur, King nedenini söyler. «Şimdi» grubu saate, güne ve modülün
     sunduklarına göre en çok üç öneri seçer (kural; model yok). */
  function yetenekler(){
    const K = (KI.ayar && KI.ayar.kartlar) || {}, fn = n => typeof K[n] === 'function';
    const s = (ad, ip, o) => Object.assign({ ad, ip }, o);
    const sec = KI.ARACLAR.filter(a => { try{ return a.kosul(); }catch(e){ return false; } });
    const ek = id => { const a = sec.find(x => x.is === id); return a ? s(a.ad, a.ip, { is:a.is }) : null; };
    const gruplar = [
      { ad:'Kart ve soru', l:[
        fn('ders') && s('Konu anlat', 'Modülün anlatımı bölüm bölüm; sonunda soru', { doldur:String(K.dersOrnek || 'bu konuyu anlat') }),
        fn('istatistik') && s('İstatistik kartları', 'Modülün sayıları kart olarak', { calis:'istatistiklerim' }),
        fn('soru') && s('Bana soru sor', 'Modülün bankasından soru kartı; şıklar düğme', { calis:'bana soru sor' }),
        fn('soru') && s('Konudan soru', 'Belirli bir konudan soru', { doldur:'türev hakkında soru sor' }),
        fn('oncelik') && s('Neye çalışayım', 'Öncelik sırası ve nedeni', { calis:'neye çalışayım' }),
        fn('yuk') && s('Yük durumum', 'Son 7 gün ile önceki 7 gün', { calis:'yük durumum' }),
      ] },
      { ad:'Araştır ve oku', l:[
        s('Araştır', 'Kaynaklı özet, videolar, okunacaklar', { doldur:'fotosentezi araştır', merkez:true }),
        s('Arka planda araştır', 'Ekibe verilir, sen konuşmaya devam edersin', { doldur:'arka planda yapay zekâ tarihini araştır', merkez:true }),
        ek('pdf-sec'),
        KI.D() && s('Notlarımda ara', 'Defter’deki notlarına dayanarak', { doldur:'notlarımda türev' }),
        s('Derse çevir', 'PDF ya da metinden kaynaklı ders ve sorular', { doldur:'derse çevir: ', merkez:true }),
        KI.kdDersler().length && s('Derslerimden soru', 'Kendi derslerinden, tekrar takvimiyle', { calis:'derslerimden soru sor' }),
      ] },
      { ad:'Gör', l:[ek('foto-sec'), ek('kip:kamera'), ek('kip:ekran'), ek('ekran'), ek('barkod')] },
      { ad:'Planla ve takip et', l:[
        s('Bugünün özeti', 'Bu modülde bugün ne var', { hazir:KI.HAZIR.findIndex(h => h.ozet) }),
        s('Odak sayacı', 'Başlıkta kalan süre; bitince kaydet', { doldur:'25 dakika matematik çalışalım' }),
        s('Sesli özet', 'Bugünü sesli dinle; Kütüphane’de kalır', { calis:'sesli özet' }),
        fn('gun') && s('Günüm', 'Bugünün maddeleri; sıradakini tek dokunuşla başlat', { calis:'günüm' }),
        fn('gun') && s('Günü kapat', 'Kalanlar ve sesli özet', { calis:'günü kapat' }),
        K.olcu && s('Kişisel yasalar', 'Ölçülerinden senin kuralların; ilişki, neden değil', { calis:'yasalarım' }),
        s('Sınav yolculuğu', 'Bu gidişle sınav günü ve «ne olursa» (AYS › Gelecek)', { calis:'gelecek sayfasını aç' }),
        s('Görev kur', 'King adım adım plan kurar; sen başlatırsın', { doldur:'bu hafta B1’e hazırla beni', merkez:true }),
        s('Haftalık değerlendirme', 'Merkez’in hafta raporu', { calis:'haftalık değerlendirme', merkez:true }),
        s('Çapraz bulgu', 'Modüller birbirini nasıl etkiliyor', { calis:'çapraz bulgu', merkez:true }),
        KI.D() && s('Haftalık gözden geçirme', 'Üç soru; cevaplar Defter’e', { calis:'haftalık gözden geçirme' }),
        s('Kişisel deney', 'Bir kuralı dene; önce ve sonra karşılaştırılır', { doldur:'deney başlat: her gün 10 dakika yürüyüş' }),
        KI.yetkiKatalog() && KI.yetkiKatalog().bekleyenler && s('Bekleyen öneriler', 'Onaylar’da bekleyenler', { calis:'bekleyen öneriler' }),
      ] },
      { ad:'Kaydet', l:[
        KI.D() && s('Günlük', 'Anlattığın Defter’e günlük olur', { calis:'günlük yazalım' }),
        KI.D() && s('Deftere not', 'Tek satır not', { doldur:'deftere not: ' }),
      ] },
      { ad:'Rutin ve hafıza', l:[
        s('Beceri öğret', 'Tekrarlanan işi King üstlenir', { doldur:'her pazartesi bana deneme hatırlat', merkez:true }),
        s('Söz', 'Zamanı gelince nasıl geçtiğini sorar', { doldur:'yarın fizik sınavım var', merkez:true }),
        s('Ekip ne yapıyor', 'Arka plandaki işler', { calis:'ekip ne yapıyor', merkez:true }),
        s('Beni nasıl tanıyorsun', 'King’in seni tanıdığı her şey; sil ya da ekle', { is:'kisi' }),
        s('Kişilik envanteri', '20 cümle; sonuç senin sözün olur', { calis:'kişilik testi' }),
      ] },
      { ad:'Araç kutusu', l:[
        s('Hesapla', 'İşlem, yüzde, üs, parantez', { doldur:'hesapla: 1250*%18+40' }),
        s('Birim çevir', 'Uzunluk, kütle, hacim, süre, sıcaklık', { doldur:'5 km kaç mil' }),
        s('Gün hesapla', 'Kaç gün sonra hangi tarih', { doldur:'45 gün sonra hangi gün' }),
        s('Kaç gün kaldı', 'Bir tarihe kalan gün ve hafta', { doldur:'19 haziran kaç gün kaldı' }),
        s('Yapılacaklar', 'Listeni gör, dokunarak işaretle', { calis:'yapılacaklarım' }),
        s('Listeye ekle', 'Birden çok madde için ; ile ayır', { doldur:'yapılacak: fatura öde; markete git' }),
        s('Hatırlatıcı', 'Süre ya da saatle; zamanı gelince bildirim', { doldur:'20 dakika sonra hatırlat: çamaşırı as' }),
        s('Hatırlatmalarım', 'Bekleyenler ve iptal', { calis:'hatırlatmalarım' }),
        s('Karar ver', 'Seçenekler arasından rastgele', { doldur:'karar ver: pizza, makarna, çorba' }),
        s('Nefes egzersizi', 'Kutu nefesi, yaklaşık bir dakika', { calis:'nefes egzersizi' }),
        s('Zar at', 'Bir ya da birkaç zar', { calis:'2 zar at' }),
        s('Yazı tura', 'Para at', { calis:'yazı tura' }),
        s('Rastgele sayı', 'İki sayı arasında', { doldur:'1 ile 100 arası sayı' }),
        s('Hesabı böl', 'Kişi başı tutar', { doldur:'hesabı böl: 850 / 4' }),
        s('Kelime say', 'Kelime, karakter, okuma süresi', { doldur:'kelime say: ' + 'Bugün güzel bir gün.' }),
        s('Yaş hesapla', 'Yaş ve sonraki doğum gününe kalan', { doldur:'yaş hesapla: 14.03.2005' }),
        s('VKİ', 'Beden kitle indeksi; DSÖ aralığıyla', { doldur:'vki 70 kg 175 cm' }),
        s('Şifre üret', 'Güçlü, rastgele; cihazda üretilir', { calis:'şifre üret' }),
        s('Kart yap', 'Bir cümleyi Kartlarım’a ekle', { doldur:'kart yap: bugün ne öğrendim, birlikte değerlendirelim' }),
      ] },
      { ad:'Yazı ve dil', l:[
        s('Çevir', 'Herhangi bir dile', { doldur:'şunu İngilizceye çevir: ', merkez:true }),
        s('Özetle', 'Uzun metni üç maddede', { doldur:'şunu üç maddede özetle: ', merkez:true }),
        s('Basitçe anlat', 'Karışık bir şeyi sade dille', { doldur:'bunu basitçe açıkla: ', merkez:true }),
        s('Yazımı düzelt', 'Yazım ve noktalama', { doldur:'yazım ve noktalamayı düzelt: ', merkez:true }),
        s('Mesaj taslağı', 'Kısa ve nazik bir mesaj', { doldur:'kısa ve nazik bir mesaj yaz: ', merkez:true }),
        s('Fikir üret', 'Bir konuda beş fikir', { doldur:'şu konuda beş fikir ver: ', merkez:true }),
        s('E-posta yaz', 'Resmî ve kısa', { doldur:'resmî ve kısa bir e-posta yaz: ', merkez:true }),
        s('Maddele', 'Metni maddeler halinde', { doldur:'şunu madde madde yaz: ', merkez:true }),
        s('Kısalt', 'Yarı uzunluğa', { doldur:'şunu yarı uzunluğa kısalt: ', merkez:true }),
        s('Tonu değiştir', 'Daha samimi ya da daha resmî', { doldur:'şunu daha samimi yaz: ', merkez:true }),
        s('Karşı görüş', 'Bir fikre en güçlü üç itiraz', { doldur:'şu fikre en güçlü üç itirazı yaz: ', merkez:true }),
        s('Soru-cevap kartları', 'Metinden beş soru ve cevabı', { doldur:'şu metinden beş soru-cevap kartı çıkar: ', merkez:true }),
      ] },
      { ad:'Sistem', l:[
        s('Bu sistemde ne var', 'Modüller, sayfalar ve araçlar', { calis:'bu sistemde ne var' }),
        s('Görünüm', 'Tema ve görünüm', { doldur:'koyu temaya geç' }),
        s('Düşünme', 'Derin, dengeli ya da hızlı', { doldur:'derin düşün', merkez:true }),
        s('Cevapları sesli oku', 'Yazsan da sesli cevap', { calis:'cevapları sesli oku' }),
      ] },
    ].map(g => ({ ad:g.ad, l:g.l.filter(Boolean) })).filter(g => g.l.length);
    /* Şimdi: saat, gün ve bu modülün sunduklarından en çok üç öneri (öbür modülün işi girmez). */
    const t = KI.ortam.simdi(), saat = t.getHours(), hepsi = gruplar.reduce((a, g) => a.concat(g.l), []);
    /* Modüllerin işleri (Tüm işler ile aynı kaynak, arac.js ISLER): bulunulan modül önce;
       King'in ortak işleri ve yukarıda zaten olan ad tekrar edilmez. */
    const modulGruplari = ((KI.ARAC() && KI.ARAC().isler) ? KI.ARAC().isler() : []).filter(g => g.modul !== 'king')
      .map(g => ({ ad:g.ad, modul:g.modul, l:g.isler.filter(x => !hepsi.some(y => y.ad === x.ad))
        .map(x => s(x.ad, x.tur === 'foto' ? x.ne : '«' + String(x.ornek || '').trim() + '»', { is:'is-sec:' + x.i })) }))
      .filter(g => g.l.length);
    const bul = ad => hepsi.find(x => x.ad === ad);
    const simdi = [saat < 12 && bul('Bugünün özeti'), bul('Neye çalışayım'), bul('Konu anlat'), bul('Bana soru sor'),
      t.getDay() === 0 && bul('Haftalık gözden geçirme'), saat >= 19 && bul('Günlük'), KI.odak() ? null : bul('Odak sayacı')]
      .filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
    const sistem = gruplar.pop();               // «Sistem» en sonda kalır
    const ozel = kartAyar().ozel.map(o => s(o.ad, 'Kendi kartın · ' + (o.gonder ? 'dokununca sorar' : 'yazı alanına koyar'),
      Object.assign({ ozel:o.id }, o.gonder ? { calis:o.metin } : { doldur:o.metin })));
    return (simdi.length ? [{ ad:'Şimdi', l:simdi }] : []).concat(ozel.length ? [{ ad:'Kendi kartlarım', l:ozel }] : [], gruplar, modulGruplari, [sistem]);
  }
  /* ARAÇLAR SOHBETTE (kullanıcı, 2026-10-23: «araçlar kısmını sohbet ekranına
     gelen minik ikonlarla duran minik kutular şeklinde»). Raydaki Araçlar
     sohbet ekranını açar; akışın yerinde minik kutular durur, yazı alanı
     altta kalır. Kutu: aracın kendi simgesi ve adı; açıklama ve örnek ipucu
     olarak (title, aria-label). Merkez isteyen kutunun simgesinde nokta.
     Dokunmak sohbete döner ve aracı çalıştırır. Boş sohbette öne çıkanlar
     da aynı kutularla durur. Liste sütunu grupların dizinidir. */
  const ONE_CIKAN = ['Kişisel yasalar', 'Günüm', 'Derse çevir', 'Sınav yolculuğu', 'Konu anlat'];
  const S_ = (...l) => l.join('');
  const ARAC_SIMGE = {
    'Kişisel yasalar':S_('<path d="M12 4v16M5 20h14"/>', '<path d="M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/>'),
    'Günüm':S_('<circle cx="12" cy="12" r="4"/>', '<path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
    'Günü kapat':'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    'Derse çevir':S_('<path d="M3 6.5C5.5 5 8.5 5 12 7c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/>', '<path d="M12 7v12.5"/>'),
    'Sınav yolculuğu':S_('<path d="M4 19l5-6 4 3 7-9"/>', '<path d="M15 7h5v5"/>'),
    'Konu anlat':S_('<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/>', '<path d="M6.5 11v4.5c3 2 8 2 11 0V11M21.5 9v5"/>'),
    'İstatistik kartları':'<path d="M5 20V11M10 20V5M15 20v-7M20 20v-4"/>',
    'Bana soru sor':S_('<circle cx="12" cy="12" r="8.5"/>', '<path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>'),
    'Konudan soru':S_('<rect x="4" y="4" width="16" height="16" rx="3"/>', '<path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>'),
    'Neye çalışayım':S_('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>', '<circle cx="12" cy="12" r="1"/>'),
    'Yük durumum':S_('<path d="M4 16a8 8 0 1 1 16 0"/>', '<path d="M12 16l4-5"/>'),
    'Araştır':S_('<circle cx="11" cy="11" r="6"/>', '<path d="M20 20l-4.5-4.5"/>'),
    'Arka planda araştır':S_('<circle cx="10" cy="10" r="5"/>', '<path d="M17.5 17.5l-3.8-3.8M15 4h5M17.5 1.5v5"/>'),
    'PDF':S_('<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/>', '<path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>'),
    'Notlarımda ara':S_('<path d="M6 3.5h9l3.5 3.5v13.5H6z"/>', '<circle cx="11.5" cy="13" r="2.5"/><path d="M15.5 17l-2.2-2.2"/>'),
    'Derslerimden soru':S_('<path d="M3 6.5C5.5 5 8.5 5 12 7c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/>', '<path d="M12 11v.01"/>'),
    'Fotoğraf':S_('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/>', '<path d="M20.5 15.5l-5-5-8.5 8.5"/>'),
    'Kamera':S_('<rect x="3" y="7" width="13" height="10" rx="2"/>', '<path d="M16 11l5-3v8l-5-3"/>'),
    'Ekran':S_('<rect x="3.5" y="5" width="17" height="11.5" rx="2"/>', '<path d="M9 20h6M12 16.5V20"/>'),
    'Bu sayfayı göster':S_('<path d="M5 4.5h9l5 5v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z"/>', '<circle cx="11" cy="13.5" r="2.5"/><path d="M13 15.5l2.5 2.5"/>'),
    'Barkod':'<path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12"/>',
    'Bugünün özeti':S_('<rect x="4" y="4.5" width="16" height="15" rx="2"/>', '<path d="M8 9h8M8 12.5h8M8 16h5"/>'),
    'Odak sayacı':S_('<circle cx="12" cy="13" r="7.5"/>', '<path d="M12 9v4l2.5 1.5M10 2.5h4"/>'),
    'Sesli özet':S_('<path d="M5 9.5v5h3.5L13 18.5v-13L8.5 9.5z"/>', '<path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>'),
    'Görev kur':S_('<path d="M10 7h10M10 12h10M10 17h10"/>', '<path d="M3.8 7l1.4 1.4L7.8 5.6M3.8 12l1.4 1.4 2.6-2.8"/><circle cx="5.5" cy="17" r="1.3"/>'),
    'Haftalık değerlendirme':S_('<rect x="4" y="5" width="16" height="15" rx="2"/>', '<path d="M4 10h16M9 3v4M15 3v4M8.5 15l2 2 4-4"/>'),
    'Çapraz bulgu':S_('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/>', '<path d="M8.3 11l7.4-4M8.3 13l7.4 4"/>'),
    'Haftalık gözden geçirme':S_('<path d="M4 12a8 8 0 1 0 2.3-5.6"/>', '<path d="M4 4.5v3.8h3.8M12 8v4.5l3 1.5"/>'),
    'Kişisel deney':S_('<path d="M9.5 3.5h5M10 3.5v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5v-6"/>', '<path d="M7.5 14.5h9"/>'),
    'Bekleyen öneriler':S_('<path d="M4 13.5l2.5-8h11l2.5 8v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>', '<path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"/>'),
    'Günlük':S_('<path d="M6 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6z"/>', '<path d="M6 3.5v17M10 8h5M10 11.5h5"/>'),
    'Deftere not':S_('<path d="M4 20h4L19 9l-4-4L4 16z"/>', '<path d="M13.5 6.5l4 4"/>'),
    'Beceri öğret':'<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
    'Söz':S_('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 16.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6.5A1.5 1.5 0 0 1 5 5z"/>', '<path d="M8.5 11l2.2 2.2L15.5 8.5"/>'),
    'Ekip ne yapıyor':S_('<circle cx="9" cy="8.5" r="3"/><circle cx="17" cy="9.5" r="2.4"/>', '<path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4 4 0 0 1 6.5-3.1"/>'),
    'Beni nasıl tanıyorsun':S_('<circle cx="12" cy="8.5" r="3.5"/>', '<path d="M5 20a7 7 0 0 1 14 0"/>'),
    'Kişilik envanteri':S_('<circle cx="12" cy="8.5" r="3.5"/>', '<path d="M5 20a7 7 0 0 1 14 0M17.5 3.5l1 1.5 1.8.3-1.3 1.3.3 1.8-1.8-.9-1.6.9.3-1.8-1.3-1.3 1.8-.3z"/>'),
    'Bu sistemde ne var':S_('<path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/>', '<path d="M9 4.5v13M15 6.5v13"/>'),
    'Görünüm':S_('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 1.8-1 1.3-2.1-.6-1.3.3-2.4 1.7-2.4H18a2.5 2.5 0 0 0 2.5-2.5A8.5 8.5 0 0 0 12 3.5z"/>', '<circle cx="8" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/>'),
    'Düşünme':S_('<path d="M9 18.5h6M10 21h4"/>', '<path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>'),
    'Hesapla':S_('<rect x="5" y="3.5" width="14" height="17" rx="2"/>', '<path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01"/>'),
    'Birim çevir':S_('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),
    'Gün hesapla':S_('<rect x="4" y="5" width="16" height="15" rx="2"/>', '<path d="M4 10h16M9 3v4M15 3v4M10 15h4M12 13v4"/>'),
    'Kaç gün kaldı':S_('<rect x="4" y="5" width="16" height="15" rx="2"/>', '<path d="M4 10h16M9 3v4M15 3v4M12 13v3l2 1"/>'),
    'Yapılacaklar':S_('<rect x="4" y="4" width="16" height="16" rx="3"/>', '<path d="M8 12l2.5 2.5L16 9"/>'),
    'Listeye ekle':S_('<path d="M5 7h10M5 12h10M5 17h6"/>', '<path d="M18 14v6M15 17h6"/>'),
    'Hatırlatıcı':S_('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/>', '<path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    'Hatırlatmalarım':S_('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/>', '<path d="M10 20.5a2 2 0 0 0 4 0M12 8v3.5l2 1"/>'),
    'Karar ver':S_('<rect x="4" y="4" width="16" height="16" rx="3"/>', '<circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>'),
    'Nefes egzersizi':S_('<path d="M4 9h10a3 3 0 1 0-3-3"/>', '<path d="M4 13h14a3 3 0 1 1-3 3M4 17h7"/>'),
    'Çevir':S_('<path d="M4 6h8M8 4v2M5.5 6c.5 3 2.5 5.5 5.5 7M10.5 6c-.5 3-2.5 5.5-6 7"/>', '<path d="M12 20l4-9 4 9M13.5 17h5"/>'),
    'Özetle':S_('<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>'),
    'Basitçe anlat':S_('<path d="M9 18.5h6M10 21h4"/>', '<path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/><path d="M10 9.5l2 2 2-2"/>'),
    'Yazımı düzelt':S_('<path d="M4 18l4.5-12h1L14 18M5.5 14h7"/>', '<path d="M15 15l2 2 4-4"/>'),
    'Mesaj taslağı':S_('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/>', '<path d="M4 7l8 6 8-6"/>'),
    'Fikir üret':S_('<path d="M12 3v2M5.6 5.6L7 7M3 12h2M19 12h2M17 7l1.4-1.4"/>', '<path d="M9 18h6M10 21h4M8.5 14.5a5 5 0 1 1 7 0c-.8.8-1.5 1.8-1.5 3h-4c0-1.2-.7-2.2-1.5-3z"/>'),
    'Zar at':S_('<rect x="4" y="4" width="16" height="16" rx="3.5"/>', '<circle cx="8.5" cy="8.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/>'),
    'Yazı tura':S_('<circle cx="12" cy="12" r="8"/>', '<circle cx="12" cy="12" r="5"/><path d="M12 9.5v5"/>'),
    'Rastgele sayı':S_('<path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3"/>', '<path d="M18 5l2 2-2 2M18 15l2 2-2 2"/>'),
    'Hesabı böl':S_('<path d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z"/>', '<path d="M9 9h6M9 13h6"/>'),
    'Kelime say':S_('<path d="M5 6h14M5 10h14M5 14h8"/>', '<path d="M16 15.5h4M18 13.5v4M15.5 20h5"/>'),
    'Yaş hesapla':S_('<path d="M5 20.5h14M6 20.5v-7h12v7"/>', '<path d="M6 16.5c2 1 4 1 6 0s4-1 6 0M9 13.5V11M12 13.5V11M15 13.5V11M9 8.5v.01M12 8.5v.01M15 8.5v.01"/>'),
    'VKİ':S_('<rect x="4" y="4" width="16" height="16" rx="3"/>', '<path d="M8 10a4 4 0 0 1 8 0M12 10l1.5-2"/>'),
    'Şifre üret':S_('<rect x="5" y="10.5" width="14" height="10" rx="2"/>', '<path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>'),
    'Kart yap':S_('<rect x="3.5" y="6" width="13" height="14" rx="2"/>', '<path d="M7.5 6V4.5a1 1 0 0 1 1-1H19a1.5 1.5 0 0 1 1.5 1.5v11a1 1 0 0 1-1 1h-3M10 10.5v5M7.5 13h5"/>'),
    'E-posta yaz':S_('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/>', '<path d="M4 7l8 6 8-6M14 17.5l5-5"/>'),
    'Maddele':S_('<path d="M9 7h11M9 12h11M9 17h11"/>', '<circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/>'),
    'Kısalt':S_('<path d="M4 7h16M4 12h10M4 17h6"/>', '<path d="M17 14l3 3-3 3"/>'),
    'Tonu değiştir':S_('<path d="M4 18c3-8 5-8 8 0s5 8 8 0"/>', '<path d="M4 6h6M14 6h6"/>'),
    'Karşı görüş':S_('<path d="M4 6h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8l-4 3z"/>', '<path d="M20 10h-1M19 10v7l-3-2h-4"/>'),
    'Soru-cevap kartları':S_('<rect x="3.5" y="7" width="12" height="13" rx="2"/>', '<path d="M8 3.5h10.5a2 2 0 0 1 2 2V16M7.5 11.5a2 2 0 1 1 2.7 1.9c-.4.2-.7.5-.7 1v.3M9.5 17h.01"/>'),
    'Cevapları sesli oku':S_('<path d="M5 9.5v5h3.5L13 18.5v-13L8.5 9.5z"/>', '<path d="M16.5 9a4 4 0 0 1 0 6"/>'),
  };
  const GRUP_SVG_MODUL = '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>';
  function vitrinEylem(x){
    const tur = x.calis ? 'calis' : x.doldur != null ? 'doldur' : 'is';
    return { tur, eylem:x.calis ? 'oner-metin:' + x.calis : x.doldur != null ? 'doldur:' + x.doldur : x.is };
  }
  /* Tür renkleri (kullanıcı, 2026-10-23: «türlerine göre renkler ekle»): her grup
     bir renk; modül grupları modülün kendi rengi. Renk yalnız simgeyi ve
     grubun noktasını boyar, metin nötr kalır (kontrast). */
  const RENK = { 'Şimdi':'mavi', 'Kart ve soru':'mor', 'Araştır ve oku':'turkuaz', 'Gör':'turuncu', 'Planla ve takip et':'yesil',
    'Kaydet':'sari', 'Rutin ve hafıza':'pembe', 'Araç kutusu':'kehribar', 'Yazı ve dil':'lacivert', 'Sistem':'gri', 'Kendi kartlarım':'kirmizi' };
  const renkOf = g => g.modul || RENK[g.ad] || 'gri';
  function renkHaritasi(){ const h = {}; yetenekler().forEach(g => g.l.forEach(x => { if(!h[x.ad]) h[x.ad] = renkOf(g); })); return h; }
  /* KARTLARIM (kullanıcı, 2026-10-23: «kartları ekleyip çıkartabilelim, yeni kart
     ekleyebilelim, renklerini ve emojilerini belirleyebilelim; bir konuyu kart
     olarak ekleyebilelim»). Kartlarım = Araçlar'ın en üstü ve boş sohbetin
     kutuları; varsayılanı ONE_CIKAN. Kendi kartın bir cümledir: dokununca ya
     hemen sorulur ya da yazı alanına konur (söz 37). Renk ve emoji yalnız
     görünüştür; aracın işi değişmez. Cihazda (lifeos.king.kartlarim, TASINAN). */
  const KART = 'lifeos.king.kartlarim';
  const KART_RENK = ['mavi', 'lacivert', 'mor', 'pembe', 'kirmizi', 'turuncu', 'kehribar', 'sari', 'yesil', 'turkuaz', 'gri'];
  const KART_RENK_AD = { mavi:'Mavi', lacivert:'Lacivert', mor:'Mor', pembe:'Pembe', kirmizi:'Kırmızı', turuncu:'Turuncu', kehribar:'Kehribar', sari:'Sarı', yesil:'Yeşil', turkuaz:'Turkuaz', gri:'Gri' };
  const KART_EMOJI = ['💬', '📚', '🧠', '🎯', '📝', '⏱️', '💡', '🔥', '✅', '📈', '🌙', '☀️', '🏃', '🍎', '💧', '😴', '🧘', '🎧', '✈️', '💰', '❤️', '⭐', '🚀', '🎨'];
  KI.kartOnbellek = null;
  function kartAyar(){
    if(KI.kartOnbellek) return KI.kartOnbellek;
    const v = KI.ortam.depo.oku(KART), o = v && typeof v === 'object' ? v : {};
    KI.kartOnbellek = { sabit:Array.isArray(o.sabit) ? o.sabit.filter(x => typeof x === 'string') : null,
      ozel:Array.isArray(o.ozel) ? o.ozel.filter(x => x && x.id && x.ad && x.metin) : [],
      renk:o.renk && typeof o.renk === 'object' ? o.renk : {}, emoji:o.emoji && typeof o.emoji === 'object' ? o.emoji : {} };
    return KI.kartOnbellek;
  }
  function kartYaz(v){ KI.kartOnbellek = null; KI.ortam.depo.yaz(KART, v); }
  const kartAnahtar = x => x.ozel ? 'o:' + x.ozel : x.ad;
  const sabitler = A => (A.sabit || ONE_CIKAN).slice();
  function kartSabitle(key, ac){
    const A = kartAyar(), l = sabitler(A), i = l.indexOf(key);
    if(i >= 0 && ac !== true) l.splice(i, 1); else if(i < 0 && ac !== false) l.push(key);
    A.sabit = l; kartYaz(A);
  }
  function kartSus(key, alan, deger){
    if(!key) return;
    const A = kartAyar();
    if(deger) A[alan][key] = deger; else delete A[alan][key];
    kartYaz(A);
  }
  function kartTasi(key, yon){
    const A = kartAyar(), l = sabitler(A), i = l.indexOf(key), j = i + yon;
    if(i < 0 || j < 0 || j >= l.length) return;
    l.splice(j, 0, l.splice(i, 1)[0]); A.sabit = l; kartYaz(A);
  }
  function kartEkle(ad, metin, gonder){
    const A = kartAyar(), id = 'k' + KI.ortam.simdi().getTime().toString(36) + KI.rastgele(1296).toString(36);
    A.ozel = A.ozel.concat([{ id, ad:String(ad).trim().slice(0, 28), metin:String(metin).trim().slice(0, 600), gonder:!!gonder }]).slice(-40);
    A.sabit = sabitler(A).concat(['o:' + id]);
    kartYaz(A);
    return id;
  }
  function kartSil(id){
    const A = kartAyar(), key = 'o:' + id;
    A.ozel = A.ozel.filter(x => x.id !== id); A.sabit = sabitler(A).filter(x => x !== key);
    delete A.renk[key]; delete A.emoji[key];
    kartYaz(A);
  }
  KI.kvDuzen = false; KI.kvSecili = null; KI.kvYeni = false; KI.kvTaslak = ''; KI.kvGiris = true;
  function kartSimge(x, emoji){
    return emoji ? '<span class="kv-mini-simge kv-mini-simge--emoji" aria-hidden="true">' + KI.kac(emoji) + '</span>'
      : '<span class="kv-mini-simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + (ARAC_SIMGE[x.ad] || (x.ozel ? ARAC_SIMGE['Kart yap'] : GRUP_SVG_MODUL)) + '</svg>'
        + (x.merkez && !KI.baglanti() ? '<i class="kv-mini-merkez"></i>' : '') + '</span>';
  }
  function miniKutu(x, i, duzen){
    const A = kartAyar(), key = kartAnahtar(x), renk = A.renk[key] || x.renk, emoji = A.emoji[key] || '';
    const e = vitrinEylem(x), sonuk = x.merkez && !KI.baglanti();
    const ornek = x.doldur != null ? x.doldur.trim() : x.calis || '';
    const ip = x.ip + (ornek ? ' · «' + ornek + '»' : '') + (sonuk ? ' · Merkez gerekli' : '');
    const ara = ' data-king-ara="' + KI.kac((x.ad + ' ' + x.ip + ' ' + ornek).toLocaleLowerCase('tr')) + '"';
    const st = ' style="--i:' + (i || 0) + '"', rk = renk ? ' data-renk="' + renk + '"' : '';
    if(duzen){
      const sabit = sabitler(A).indexOf(key) >= 0;
      return '<div class="kv-mini is-duzen' + (KI.kvSecili === key ? ' is-secili' : '') + '"' + rk + ara + st + '>'
        + '<button type="button" class="kv-mini-sec" data-king="kv-sec:' + KI.kac(key) + '" aria-pressed="' + (KI.kvSecili === key) + '" aria-label="' + KI.kac(x.ad) + ': rengini ve simgesini düzenle">'
        + kartSimge(x, emoji) + '<span class="kv-mini-ad">' + KI.kac(x.ad) + '</span></button>'
        + '<button type="button" class="kv-mini-rozet' + (sabit ? ' is-sabit' : '') + '" data-king="kv-sabit:' + KI.kac(key) + '" aria-label="' + (sabit ? 'Kartlarımdan çıkar' : 'Kartlarıma ekle') + ': ' + KI.kac(x.ad) + '" title="' + (sabit ? 'Kartlarımdan çıkar' : 'Kartlarıma ekle') + '">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (sabit ? 'M6 12h12' : 'M12 6v12M6 12h12') + '"/></svg></button></div>';
    }
    return '<button type="button" class="kv-mini' + (sonuk ? ' is-sonuk' : '') + '"' + rk + ara + st
      + (x.hazir != null ? ' data-king-hazir="' + x.hazir + '" data-king="hazir"' : ' data-king="' + KI.kac(e.eylem) + '"')
      + ' title="' + KI.kac(ip) + '" aria-label="' + KI.kac(x.ad + ': ' + ip) + '">'
      + kartSimge(x, emoji) + '<span class="kv-mini-ad">' + KI.kac(x.ad) + '</span></button>';
  }
  function tumKartlar(gruplar){ return (gruplar || yetenekler()).reduce((a, g) => a.concat(g.l.map(x => Object.assign({ renk:renkOf(g) }, x))), []); }
  function oneCikanlar(gruplar){
    const hepsi = tumKartlar(gruplar);
    return sabitler(kartAyar()).map(k => hepsi.find(x => kartAnahtar(x) === k)).filter(Boolean);
  }
  function kvPanel(x){
    const A = kartAyar(), key = kartAnahtar(x), sabit = sabitler(A).indexOf(key) >= 0;
    const renk = A.renk[key] || x.renk, emoji = A.emoji[key] || '';
    const dg = (eylem, ad, ek) => '<button type="button" class="kv-dugme' + (ek || '') + '" data-king="' + KI.kac(eylem) + '">' + ad + '</button>';
    return '<div class="kv-panel" role="group" aria-label="' + KI.kac(x.ad) + ' kartını düzenle" data-renk="' + renk + '">'
      + '<div class="kv-panel-bas">' + kartSimge(x, emoji) + '<div><b>' + KI.kac(x.ad) + '</b><small>' + KI.kac(x.ip) + '</small></div>'
      + '<button type="button" class="king__yan-kapa" data-king="kv-sec:" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>'
      + '<div class="kv-panel-satir"><span>Renk</span><div class="kv-renkler">' + KART_RENK.map(r => '<button type="button" class="kv-renk' + (r === renk ? ' is-secili' : '')
        + '" data-renk="' + r + '" data-king="kv-renk:' + r + '" aria-pressed="' + (r === renk) + '" aria-label="' + KART_RENK_AD[r] + '" title="' + KART_RENK_AD[r] + '"></button>').join('') + '</div></div>'
      + '<div class="kv-panel-satir"><span>Simge</span><div class="kv-emojiler">'
      + '<button type="button" class="kv-emoji kv-emoji--ozgun' + (emoji ? '' : ' is-secili') + '" data-king="kv-emoji:" aria-pressed="' + !emoji + '" aria-label="Özgün simge" title="Özgün simge"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + (ARAC_SIMGE[x.ad] || (x.ozel ? ARAC_SIMGE['Kart yap'] : GRUP_SVG_MODUL)) + '</svg></button>'
      + KART_EMOJI.map(m => '<button type="button" class="kv-emoji' + (m === emoji ? ' is-secili' : '') + '" data-king="kv-emoji:' + m + '" aria-pressed="' + (m === emoji) + '" aria-label="' + m + '">' + m + '</button>').join('')
      + '<input class="kv-emoji-gir" data-king-kv-emoji maxlength="8" placeholder="Başka" aria-label="Kendi emojin" value="' + (emoji && KART_EMOJI.indexOf(emoji) < 0 ? KI.kac(emoji) : '') + '"/></div></div>'
      + '<div class="kv-panel-eylem">'
      + (sabit ? dg('kv-tasi:-1', '← Öne al') + dg('kv-tasi:1', 'Geriye al →') : '')
      + dg('kv-sabit:' + key, sabit ? 'Kartlarımdan çıkar' : 'Kartlarıma ekle', sabit ? '' : ' kv-dugme--birincil')
      + ((A.renk[key] || A.emoji[key]) ? dg('kv-varsayilan', 'Özgün görünüm') : '')
      + (x.ozel ? dg('kv-sil:' + x.ozel, 'Kartı sil', ' kv-dugme--tehlike') : '')
      + '</div></div>';
  }
  function kvYeniForm(){
    return '<form class="kv-panel kv-yeni" data-king-kv-form aria-label="Yeni kart">'
      + '<div class="kv-panel-bas"><span class="kv-mini-simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + ARAC_SIMGE['Kart yap'] + '</svg></span>'
      + '<div><b>Yeni kart</b><small>Bir konu, bir soru ya da sık yazdığın bir istek. Kartlarım’a eklenir; rengini ve simgesini sonra seçersin.</small></div>'
      + '<button type="button" class="king__yan-kapa" data-king="kv-yeni-kapat" aria-label="Vazgeç"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>'
      + '<label class="kv-alan"><span>Ad</span><input name="ad" maxlength="28" required placeholder="Örn. Akşam değerlendirmesi" autocomplete="off"/></label>'
      + '<label class="kv-alan"><span>Metin</span><textarea name="metin" rows="3" maxlength="600" required placeholder="Örn. Bugün ne öğrendim, birlikte değerlendirelim">' + KI.kac(KI.kvTaslak) + '</textarea></label>'
      + '<div class="kv-secim" role="radiogroup" aria-label="Dokununca"><label><input type="radio" name="gonder" value="1" checked/><span>Dokununca hemen sor</span></label>'
      + '<label><input type="radio" name="gonder" value="0"/><span>Yazı alanına koy, ben tamamlarım</span></label></div>'
      + '<div class="kv-panel-eylem"><button type="submit" class="kv-dugme kv-dugme--birincil">Kartı ekle</button>'
      + '<button type="button" class="kv-dugme" data-king="kv-yeni-kapat">Vazgeç</button></div></form>';
  }
  function vitrinHtml(){
    const gruplar = yetenekler(), one = oneCikanlar(gruplar), d = KI.kvDuzen;
    const secili = d && KI.kvSecili ? tumKartlar(gruplar).find(x => kartAnahtar(x) === KI.kvSecili) : null;
    let panelYok = !!secili;
    const panel = l => { if(panelYok && l.some(x => kartAnahtar(x) === KI.kvSecili)){ panelYok = false; return kvPanel(secili); } return ''; };
    const giris = KI.kvGiris ? ' is-giris' : '';
    return '<section class="king__vitrin' + giris + (d ? ' is-duzen' : '') + '" data-king-vitrin aria-label="Araçlar">'
      + '<header class="kv-bas"><h2 class="kv-baslik">Araçlar</h2>'
      + '<input class="king__ara kv-ara" type="search" data-king-ara-girdi placeholder="Ara: ders, uyku, hesap…" aria-label="Araçlarda ara" autocomplete="off"/>'
      + '<button type="button" class="kv-dugme" data-king="kv-yeni"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Yeni kart</button>'
      + '<button type="button" class="kv-dugme' + (d ? ' kv-dugme--birincil' : '') + '" data-king="kv-duzen" aria-pressed="' + d + '">' + (d ? 'Bitti' : 'Düzenle') + '</button></header>'
      + (KI.kvYeni ? kvYeniForm() : '')
      + (d ? '<p class="kv-ipucu">Kartı seç: rengini ve simgesini değiştir. <b>+</b> Kartlarım’a ekler, <b>−</b> çıkarır.'
        + (kartAyar().sabit ? ' <button type="button" class="kv-bag" data-king="kv-sifirla">Kartlarımı varsayılana döndür</button>' : '') + '</p>' : '')
      + '<div class="kv-grup kv-grup--one" style="--g:0"><h3 class="kv-grup-ad">Kartlarım<small>' + one.length + '</small></h3><div class="kv-izgara">'
        + one.map((x, i) => miniKutu(x, i, d)).join('')
        + (one.length ? '' : '<p class="kv-bos">Kartlarım boş. «Düzenle»yi aç, istediğin aracın <b>+</b>’sına dokun ya da «Yeni kart» ekle.</p>')
        + '</div>' + panel(one) + '</div>'
      + gruplar.map((g, gi) => {
        const l = g.l.map(x => Object.assign({ renk:renkOf(g) }, x));
        return '<div class="kv-grup" id="kv-' + gi + '" data-renk="' + renkOf(g) + '" style="--g:' + (gi + 1) + '"><h3 class="kv-grup-ad"><i class="kv-grup-nokta" aria-hidden="true"></i>' + KI.kac(g.ad) + '<small>' + g.l.length + '</small></h3>'
          + '<div class="kv-izgara">' + l.map((x, i) => miniKutu(x, i, d)).join('') + '</div>' + panel(l) + '</div>';
      }).join('')
      + '<p class="kv-not">Dokun: hemen yapar ya da örneği yazı alanına koyar. Sayıları her zaman modülün kendi kodu üretir.</p>'
      + '</section>';
  }
  /* Sol dizin (kullanıcı, 2026-10-23: «sol tarafı bayağı küçült, sadece yazılar»): dar sütun, renk noktası ve ad. */
  function vitrinDizin(){
    return '<nav class="kv-dizin" aria-label="Yetenek grupları">' + yetenekler().map((g, i) => '<button type="button" class="kv-dizin-is" data-renk="' + renkOf(g) + '" data-king="vitrin-git:' + i + '">'
      + '<i class="kv-grup-nokta" aria-hidden="true"></i><span>' + KI.kac(g.ad) + '</span></button>').join('') + '</nav>';
  }
  /* Liste satırı: başlık, alt satır, isteğe bağlı ince çubuk; tıklayınca çalışma alanı. */
  function listeSatir(eylem, bas, alt, ek, canli){
    return '<li><button type="button" class="king__satir" data-king="' + eylem + '"><span class="king__satir-bas">'
      + (canli ? '<i class="king__canli-nokta" aria-hidden="true"></i>' : '') + '<span>' + KI.kac(bas) + '</span></span>'
      + (alt ? '<small>' + KI.kac(alt) + '</small>' : '') + (ek || '') + '</button></li>';
  }
  function gorevListe(){
    if(!KI.baglanti()) return KI.yanBos('Görevler Merkez’de (HKM) çalışır; Merkez bağlı değil.');
    if(!KI.ekip.yuklu) return '<p class="king__yan-bos" role="status">Yükleniyor…</p>';
    const sira = { suruyor:0, taslak:1, bitti:2, iptal:3 };
    const gorevler = KI.ekip.gorevler.slice().sort((a, b) => (sira[a.durum] - sira[b.durum]) || (b.id - a.id)).slice(0, 12);
    const isler = KI.ekip.isler.filter(i => i.tur !== 'gorev_adim' || KI.ACIK_IS.indexOf(i.durum) >= 0).slice(0, 12);
    return KI.listeGrup('Görevler', gorevler.length ? '<ul class="king__gecmis">' + gorevler.map(g => {
        const il = g.ilerleme || {}, oran = (il.bitti || 0) + '/' + (il.toplam || 0);
        return listeSatir('ekip-ac', g.hedef, oran + ' adım · ' + (g.durum_ad || g.durum), KI.cubukHtml(il.yuzde, oran + ' adım bitti'), g.durum === 'suruyor');
      }).join('') + '</ul>'
      : KI.yanBos('Görev yok. «Bu hafta B1’e hazırla beni» gibi yaz; King adım adım kurar, sen başlatmadan başlamaz.'))
      + KI.listeGrup('Arka planda', isler.length ? '<ul class="king__gecmis">' + isler.map(i => listeSatir('ekip-ac', i.baslik,
          KI.isAjanAd(i) + ' · ' + (i.durum_ad || i.durum), i.durum === 'calisiyor' ? KI.cubukHtml(i.ilerleme, i.baslik + ': yüzde ' + (Number(i.ilerleme) || 0)) : '',
          KI.ACIK_IS.indexOf(i.durum) >= 0)).join('') + '</ul>'
        : KI.yanBos('Arka planda iş yok. «Arka planda … araştır» dersen ekibe veririm, sen konuşmaya devam edersin.'));
  }
  function rutinListe(){
    if(!KI.baglanti()) return KI.yanBos('Beceriler ve sözler Merkez’de (HKM) durur; Merkez bağlı değil.');
    if(!KI.beceriV.yuklu) return '<p class="king__yan-bos" role="status">Yükleniyor…</p>';
    const sozler = KI.beceriV.sozler.filter(s => s.durum === 'bekliyor' || s.durum === 'soruldu');
    return KI.listeGrup('Beceriler', KI.beceriV.beceriler.length ? '<ul class="king__gecmis">' + KI.beceriV.beceriler.map(b => {
        const id = Number(b.id);
        return '<li class="king__satir-sar' + (b.acik ? '' : ' is-kapali') + '"><button type="button" class="king__satir" data-king="beceri-ac"><span class="king__satir-bas"><span>' + KI.kac(b.ad) + '</span></span>'
          + '<small>' + KI.kac(KI.tetikMetni(b.tetik)) + '</small></button>'
          + '<button type="button" class="king__secim" role="switch" aria-checked="' + (b.acik ? 'true' : 'false') + '" data-king="beceri-' + (b.acik ? 'kapat' : 'ac') + ':' + id
          + '" aria-label="' + KI.kac(b.ad) + (b.acik ? ' açık' : ' kapalı') + '"><span class="king__anahtar' + (b.acik ? ' is-acik' : '') + '" aria-hidden="true"><i></i></span></button></li>';
      }).join('') + '</ul>'
      : KI.yanBos('Beceri yok. «Her pazartesi bana deneme hatırlat» ya da «‘ders bitti’ deyince mola aç» diye öğret.'))
      + KI.listeGrup('Sözler', sozler.length ? '<ul class="king__gecmis">' + sozler.map(s => listeSatir('beceri-ac', s.metin,
          (s.durum_ad || s.durum) + (s.vade_metin ? ' · ' + s.vade_metin : ''))).join('') + '</ul>'
        : KI.yanBos('Açık söz yok. «Yarın fizik sınavım var» dersen zamanı gelince nasıl geçtiğini sorarım.'));
  }
  /* KÜTÜPHANE SAYFASI (kullanıcı, 2026-10-23: «soldan açılan bir sayfa değil, karşımıza
     gelen bir sayfa; resimler, videolar, sesler, arşivlenmiş sohbetler»). Araçlar gibi
     sohbet ekranının yerinde durur; solda yalnız bölüm adları (dokununca süzer).
     Hepsi cihazdaki kayıtlardan: kayıtlı sohbetler ve klasörleri, Derslerim, sesli
     özetler, araştırmaların videoları ve okumaları (kayıtlı sohbetlerdekiler dahil),
     gönderdiğin fotoğrafların küçük kopyaları, Merkez sırası. Uydurma kayıt yok. */
  const KUT_BOLUM = [
    { id:'sohbet', ad:'Sohbetler', renk:'mavi' }, { id:'ders', ad:'Derslerim', renk:'mor' },
    { id:'ses', ad:'Sesli özetler', renk:'pembe' }, { id:'video', ad:'Videolar', renk:'kirmizi' },
    { id:'okuma', ad:'Okumalar', renk:'turkuaz' }, { id:'gorsel', ad:'Görseller', renk:'turuncu' },
    { id:'arastirma', ad:'Araştırmalar', renk:'yesil' }, { id:'sira', ad:'Sırada', renk:'gri' } ];
  const KT_SVG = {
    sohbet:'<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 16.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6.5A1.5 1.5 0 0 1 5 5z"/>',
    ders:'<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c3 2 8 2 11 0V11"/>',
    ses:'<path d="M5 9.5v5h3.5L13 18.5v-13L8.5 9.5z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
    video:'<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M10 9.5v5l4.5-2.5z"/>',
    okuma:'<path d="M3 6.5C5.5 5 8.5 5 12 7c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 7v12.5"/>',
    arastirma:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    sira:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.5"/>',
    klasor:'<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    goz:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  };
  KI.kutFiltre = 'hepsi'; KI.kutBuyuk = null;
  /* Görseller: gönderdiğin fotoğrafın en çok 480 px'lik küçük kopyası, bu cihazda (en çok 18). */
  const GORSEL = 'lifeos.king.gorseller', GORSEL_EN_COK = 18;
  function gorseller(){ const l = KI.ortam.depo.oku(GORSEL); return Array.isArray(l) ? l.filter(x => x && x.id && /^data:image\/jpeg;base64,/.test(String(x.src || ''))) : []; }
  function gorselSakla(url){
    if(typeof document === 'undefined' || typeof Image === 'undefined' || !url) return;
    const img = new Image();
    img.onload = () => {
      try{
        const o = Math.min(1, 480 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * o)); c.height = Math.max(1, Math.round(img.naturalHeight * o));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const d = KI.ortam.simdi();
        KI.ortam.depo.yaz(GORSEL, [{ id:'g' + d.getTime().toString(36), zaman:d.toISOString(), src:c.toDataURL('image/jpeg', 0.72) }].concat(gorseller()).slice(0, GORSEL_EN_COK));
        if(KI.acik && KI.bolum === 'kutuphane') KI.ciz(false);
      }catch(e){ /* yer yok ya da çizilemedi: saklanmaz */ }
    };
    img.src = url;
  }
  function kutMedya(){
    const l = [], gor = {};
    const ekle = (a, zaman) => {
      if(!a) return;
      (Array.isArray(a.izle) ? a.izle : []).forEach(v => { if(v && LINK_RE.test(String(v.link || ''))) l.push({ tur:'video', baslik:String(v.baslik || v.link), link:v.link, alt:String(v.bilgi || ''), konu:String(a.konu || ''), zaman }); });
      (Array.isArray(a.oku) ? a.oku : []).forEach(v => { if(v && LINK_RE.test(String(v.link || ''))) l.push({ tur:'okuma', baslik:String(v.baslik || v.link), link:v.link, alt:String(v.site || ''), konu:String(a.konu || ''), zaman }); });
    };
    KI.akis.forEach(m => ekle(m.arastirma, null));
    KI.arsivOku().forEach(k => k.mesajlar.forEach(m => ekle(m && m.arastirma, k.zaman)));
    return l.filter(x => { const a = x.tur + x.link; if(gor[a]) return false; gor[a] = true; return true; });
  }
  function kutVeri(){
    const medya = kutMedya();
    return { sohbet:KI.arsivOku().slice(0, KI.ARSIV_EN_COK), ders:KI.kdDersler(), ses:KI.sozetler(), video:medya.filter(x => x.tur === 'video'),
      okuma:medya.filter(x => x.tur === 'okuma'), gorsel:gorseller(),
      arastirma:KI.akis.map((m, n) => ({ m, n })).filter(x => x.m && x.m.arastirma).reverse(), sira:KI.sira() };
  }
  const ktUfak = (eylem, ad, svg) => '<button type="button" class="kt-ufak" data-king="' + KI.kac(eylem) + '" aria-label="' + ad + '" title="' + ad + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + svg + '</svg></button>';
  const KT_X = '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>';
  function ktKart(o){
    const ic = '<span class="kt-simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + o.svg + '</svg></span><span class="kt-metin"><b>' + KI.kac(o.bas) + '</b>'
      + (o.alt ? '<small>' + KI.kac(o.alt) + '</small>' : '') + '</span>';
    const ort = ' class="kt-kart" style="--i:' + (o.i || 0) + '" data-king-ara="' + KI.kac((o.bas + ' ' + (o.alt || '')).toLocaleLowerCase('tr')) + '"';
    if(o.href) return '<a' + ort + ' href="' + KI.kac(o.href) + '" target="_blank" rel="noopener noreferrer">' + ic
      + '<span class="kt-dis" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6h9v9M18 6L7 17"/></svg></span></a>';
    return '<div' + ort + '>' + (o.eylem ? '<button type="button" class="kt-ana" data-king="' + KI.kac(o.eylem) + '"' + (o.sohbete ? ' data-king-sohbete' : '') + '>' + ic + '</button>'
      : '<span class="kt-ana">' + ic + '</span>') + (o.ek ? '<span class="kt-ek">' + o.ek + '</span>' : '') + '</div>';
  }
  function ktSohbet(k, i, kls){
    const tasi = kls.length ? '<select class="kt-tasi" data-king-kt-tasi="' + KI.kac(k.id) + '" aria-label="Klasöre taşı" title="Klasöre taşı"><option value="">Klasörsüz</option>'
      + kls.map(f => '<option value="' + KI.kac(f.id) + '"' + (k.klasor === f.id ? ' selected' : '') + '>' + KI.kac(f.ad) + '</option>').join('') + '</select>' : '';
    return ktKart({ i, svg:KT_SVG.sohbet, bas:KI.kayitBasligi(k), alt:KI.tarihYaz(k.zaman) + ' · ' + k.mesajlar.length + ' mesaj' + (k.modul && KI.MODUL_AD[k.modul] ? ' · ' + KI.MODUL_AD[k.modul] : ''),
      eylem:'kayit-ac:' + k.id, sohbete:true, ek:ktUfak('kayit:' + k.id, 'Önizle', KT_SVG.goz) + tasi });
  }
  function kutuphaneHtml(){
    const v = kutVeri(), f = KI.kutFiltre, kls = KI.klasorler();
    const say = id => v[id].length;
    const var_ = id => id === 'sohbet' ? (say(id) || kls.length || KI.klasorYeni) : say(id);
    const l = KUT_BOLUM.filter(b => var_(b.id));
    const izgara = ic => '<div class="kt-izgara">' + ic + '</div>';
    const icerik = {
      sohbet:() => (KI.klasorYeni ? '<form class="king__klasor-form kt-klasor-form" data-king-klasor><input class="king__ara" type="text" maxlength="40" placeholder="Klasör adı" aria-label="Klasör adı" data-king-klasor-ad/>'
          + '<button type="submit" class="kv-dugme kv-dugme--birincil">Ekle</button></form>' : '')
        + kls.map(fl => {
          const ic = v.sohbet.filter(k => k.klasor === fl.id);
          return '<div class="king__klasor kt-klasor"><div class="kt-klasor-bas"><svg viewBox="0 0 24 24" aria-hidden="true">' + KT_SVG.klasor + '</svg><span>' + KI.kac(fl.ad) + '</span><small>' + ic.length + '</small>'
            + ktUfak('klasor-sil:' + fl.id, 'Klasörü kaldır; sohbetler silinmez', KT_X) + '</div>'
            + (ic.length ? izgara(ic.map((k, i) => ktSohbet(k, i, kls)).join('')) : '<p class="kt-not">Boş. Bir sohbeti kartındaki seçimle buraya taşı.</p>') + '</div>';
        }).join('')
        + izgara(v.sohbet.filter(k => !k.klasor || !kls.some(fl => fl.id === k.klasor)).map((k, i) => ktSohbet(k, i, kls)).join('')),
      ders:() => izgara(v.ders.map((d, i) => ktKart({ i, svg:KT_SVG.ders, bas:d.baslik, alt:d.kaynak + ' · ' + d.bolumler.length + ' bölüm · ' + d.sorular.length + ' soru', eylem:'kd-ac:' + i, sohbete:true })).join('')),
      ses:() => izgara(v.ses.map((x, i) => ktKart({ i, svg:KT_SVG.ses, bas:(KI.MODUL_AD[x.modul] || 'Sesli özet') + ' · ' + KI.tarihYaz(x.zaman), alt:x.satirlar[0] || '', eylem:'sozet-dinle:' + i })).join('')),
      video:() => izgara(v.video.map((x, i) => ktKart({ i, svg:KT_SVG.video, bas:x.baslik, alt:[x.alt, x.konu].filter(Boolean).join(' · '), href:x.link })).join('')),
      okuma:() => izgara(v.okuma.map((x, i) => ktKart({ i, svg:KT_SVG.okuma, bas:x.baslik, alt:[x.alt, x.konu].filter(Boolean).join(' · '), href:x.link })).join('')),
      gorsel:() => '<div class="kt-galeri">' + v.gorsel.map((x, i) => '<figure class="kt-gorsel" style="--i:' + i + '" data-king-ara="' + KI.kac(KI.tarihYaz(x.zaman).toLocaleLowerCase('tr')) + '">'
          + '<button type="button" class="kt-gorsel-ac" data-king="gorsel-buyut:' + KI.kac(x.id) + '" aria-label="Büyüt: ' + KI.kac(KI.tarihYaz(x.zaman)) + '"><img src="' + x.src + '" alt="Gönderdiğin fotoğraf, ' + KI.kac(KI.tarihYaz(x.zaman)) + '" loading="lazy"/></button>'
          + ktUfak('gorsel-sil:' + x.id, 'Görseli sil', KT_X) + '<figcaption>' + KI.kac(KI.tarihYaz(x.zaman)) + '</figcaption></figure>').join('') + '</div>',
      arastirma:() => izgara(v.arastirma.map((x, i) => ktKart({ i, svg:KT_SVG.arastirma, bas:x.m.arastirma.konu, alt:(x.m.arastirma.izle.length + x.m.arastirma.oku.length) + ' kaynak · bu sohbette', eylem:'ars-ac:' + x.n })).join('')),
      sira:() => izgara(v.sira.map((x, i) => ktKart({ i, svg:KT_SVG.sira, bas:x.metin, alt:KI.tarihYaz(x.zaman) + ' · Merkez bekleniyor', ek:ktUfak('sira-sil:' + i, 'Sıradan çıkar', KT_X) })).join('')),
    };
    const buyuk = KI.kutBuyuk && v.gorsel.find(x => x.id === KI.kutBuyuk);
    const toplam = l.reduce((a, b) => a + say(b.id), 0);
    return '<section class="king__kutuphane' + (KI.kvGiris ? ' is-giris' : '') + '" data-king-kutuphane aria-label="Kütüphane">'
      + '<header class="kv-bas"><h2 class="kv-baslik">Kütüphane</h2>'
      + '<input class="king__ara kv-ara" type="search" data-king-ara-girdi placeholder="Kütüphanede ara" aria-label="Kütüphanede ara" autocomplete="off"/>'
      + '<button type="button" class="kv-dugme" data-king="klasor-yeni"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Yeni klasör</button></header>'
      + (l.length > 1 ? '<div class="kt-filtre" role="group" aria-label="Süz">'
        + [{ id:'hepsi', ad:'Tümü', n:toplam }].concat(l.map(b => ({ id:b.id, ad:b.ad, n:say(b.id), renk:b.renk }))).map(c => '<button type="button" class="kt-cip' + (f === c.id ? ' is-secili' : '') + '"'
          + (c.renk ? ' data-renk="' + c.renk + '"' : '') + ' data-king="kut-filtre:' + c.id + '" aria-pressed="' + (f === c.id) + '">'
          + (c.renk ? '<i class="kv-grup-nokta" aria-hidden="true"></i>' : '') + c.ad + '<small>' + c.n + '</small></button>').join('') + '</div>' : '')
      + (l.length ? l.filter(b => f === 'hepsi' || f === b.id).map((b, gi) => '<section class="kt-bolum" id="kut-' + b.id + '" data-renk="' + b.renk + '" style="--g:' + gi + '">'
          + '<h3 class="kv-grup-ad"><i class="kv-grup-nokta" aria-hidden="true"></i>' + b.ad + '<small>' + say(b.id) + '</small></h3>' + icerik[b.id]() + '</section>').join('')
        : '<div class="kt-bos"><span class="kt-simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + KT_SVG.okuma + '</svg></span><b>Kütüphane henüz boş</b>'
          + '<p>Kayıtlı sohbetler, Derslerim, sesli özetler, araştırmaların videoları ve okumaları, gönderdiğin fotoğraflar burada toplanır.</p></div>')
      + '<p class="kv-not">Hepsi bu cihazda. Fotoğrafların küçük bir kopyası saklanır (en çok ' + GORSEL_EN_COK + '); istediğini silebilirsin.</p>'
      + (buyuk ? '<div class="kt-buyuk" role="dialog" aria-label="Görsel"><button type="button" class="kt-buyuk-perde" data-king="gorsel-buyut:" aria-label="Kapat"></button>'
        + '<figure><img src="' + buyuk.src + '" alt="Gönderdiğin fotoğraf, ' + KI.kac(KI.tarihYaz(buyuk.zaman)) + '"/><figcaption>' + KI.kac(KI.tarihYaz(buyuk.zaman))
        + ktUfak('gorsel-sil:' + buyuk.id, 'Görseli sil', KT_X) + ktUfak('gorsel-buyut:', 'Kapat', KT_X) + '</figcaption></figure></div>' : '')
      + '</section>';
  }
  function kutDizin(){
    const v = kutVeri(), l = KUT_BOLUM.filter(b => v[b.id].length);
    return '<nav class="kv-dizin" aria-label="Kütüphane bölümleri">' + (l.length
      ? [{ id:'hepsi', ad:'Tümü' }].concat(l).map(b => '<button type="button" class="kv-dizin-is' + (KI.kutFiltre === b.id ? ' is-secili' : '') + '"' + (b.renk ? ' data-renk="' + b.renk + '"' : '')
        + ' data-king="kut-filtre:' + b.id + '"><i class="kv-grup-nokta" aria-hidden="true"></i><span>' + b.ad + '</span>' + (b.renk ? '<small>' + v[b.id].length + '</small>' : '') + '</button>').join('')
      : KI.yanBos('Henüz bir şey yok.')) + '</nav>';
  }

  /* ---------- söz 32: kartlar ---------- */
  const KART_ISTAT = /(istatistik|rakamlar[ıi]m|sayılar[ıi]m|verilerimi göster|kartlar[ıi]? göster|durum kartlar)/;
  const KART_SORU = /(soru sor|sorusu sor|soru ver|soru getir|soru çek|soru çöz(elim|eyim)|beni test et|test et beni|bir soru daha)/;
  const SORU_DOLGU = /(^|\s)(bana|bir|tane|daha|soru|sorusu|sor|sorar|ver|getir|çek|lütfen|king|hakkında|konusunda|ile|ilgili|beni|test|et|çözelim|çözeyim|mısın|misin|musun)(?=\s|$)/g;
  const ETIKETLER = ['ölçüldü', 'hesaplandı', 'tahmin', 'veri yok'];
  function kartNiyeti(t){
    if(KART_SORU.test(t)){
      const konu = t.replace(/[.,!?;:]/g, ' ').replace(SORU_DOLGU, ' ').replace(SORU_DOLGU, ' ').replace(/\s+/g, ' ').trim();
      return { tur:'soru', konu };
    }
    return KART_ISTAT.test(t) ? { tur:'istatistik' } : null;
  }
  function kartTemiz(x){
    const deger = x.deger == null || x.deger === '' || (typeof x.deger === 'number' && !isFinite(x.deger)) ? null : String(x.deger);
    const seri = Array.isArray(x.seri) ? x.seri.slice(-14).map(v => (typeof v === 'number' && isFinite(v)) ? v : null) : null;
    return { ad:String(x.ad), deger, birim:x.birim ? String(x.birim) : '',
      etiket:deger == null ? 'veri yok' : (ETIKETLER.indexOf(x.etiket) >= 0 ? x.etiket : 'hesaplandı'), alt:x.alt ? String(x.alt) : '',
      seri:seri && seri.some(v => v != null) ? seri : null };
  }
  async function kartIsle(n, metin){
    KI.akis.push({ kim:'sen', metin:String(metin).trim() });
    KI.bekleyen = null; KI.bekleyenGit = null; KI.bekleyenIlet = null; KI.cipler = null;
    const K = KI.ayar && KI.ayar.kartlar ? KI.ayar.kartlar : null;
    const ad = KI.MODUL_AD[KI.ayar && KI.ayar.modul] || 'Bu modül';
    if(n.tur === 'istatistik'){
      let l = [];
      try{ l = (K && typeof K.istatistik === 'function' ? K.istatistik() : []) || []; }catch(e){ l = []; }
      l = l.filter(x => x && x.ad).map(kartTemiz).slice(0, 8);
      if(!l.length){ KI.soyle(ad + ' için gösterilecek istatistik kartı yok.'); return { tur:'kart-yok' }; }
      KI.soyle(ad + '’de son durum · sayıları ' + ad + ' kendi hesaplıyor.', null, null, null, { kartlar:l });
      return { tur:'kart-istatistik', kartlar:l.length };
    }
    if(!K || typeof K.soru !== 'function' || typeof K.cevapla !== 'function'){
      KI.soyle('Soru bankası AYS’de; AYS’yi açıp «bana soru sor» diyebilirsin.');
      return { tur:'kart-yok' };
    }
    let q = null;
    try{ q = await K.soru(n.konu || ''); }catch(e){ q = null; }
    if(!q || !q.soru || !Array.isArray(q.sec) || !q.sec.length){
      KI.soyle(n.konu ? '«' + n.konu + '» için soru bulamadım; başka bir konu dener misin?' : 'Şu an sorabileceğim bir soru bulamadım.');
      return { tur:'kart-yok' };
    }
    const soru = { id:String(q.id), konu:String(q.konu || ''), soru:String(q.soru), sec:q.sec.slice(0, 5).map(String),
      kaynak:String(q.kaynak || ''), not:String(q.not || ''), sorgu:n.konu || '' };
    KI.soyle(soru.konu ? soru.konu + ' · soru' : 'Soru', null, null, null, { soru });
    return { tur:'kart-soru', id:soru.id };
  }
  async function soruCevapla(n, harf){
    const m = KI.akis[n], K = KI.ayar && KI.ayar.kartlar;
    if(m && m.soru && !m.soru.cevap && /^kd:/.test(m.soru.id)){
      const c = KI.kdCevapla(m, harf);
      if(!c) return null;
      KI.cipler = [{ ad:'Bir soru daha', is:'oner-metin:derslerimden soru sor' }];
      KI.sakla(); KI.ciz(false);
      if(KI.sesleMi()) KI.seslendir(c.isabet ? 'Doğru.' : 'Doğru cevap ' + c.dogru + '.');
      return c;
    }
    if(!m || !m.soru || m.soru.cevap || !K || typeof K.cevapla !== 'function') return null;
    let r = null;
    try{ r = await K.cevapla(m.soru.id, harf); }catch(e){ r = null; }
    if(!r || !r.dogru){ KI.soyle('Cevabı kaydedemedim; soruyu modülün kendi ekranında deneyebilirsin.'); return null; }
    m.soru.cevap = { harf, dogru:String(r.dogru), isabet:harf === r.dogru,
      cozum:(r.cozum || []).map(String).slice(0, 6), not:String(r.not || '') };
    KI.cipler = [{ ad:'Bir soru daha', is:'soru-yeni:' + n }];
    /* Öğretmen: yanlışta, bu konunun dersi sohbetteyse yeniden anlatmayı öner. */
    const dn = m.soru.cevap.isabet ? -1 : KI.dersBul(m.soru.sorgu);
    if(dn >= 0) KI.cipler.unshift({ ad:'Konuyu yeniden anlat', is:'ders-tekrar:' + dn });
    KI.sakla();
    KI.ciz(false);
    if(KI.sesleMi()) KI.seslendir(m.soru.cevap.isabet ? 'Doğru.' : 'Doğru cevap ' + m.soru.cevap.dogru + '.');
    return m.soru.cevap;
  }
  /* ---------- söz 38: araştırma kartı (HKM arastirma.v1) ---------- */
  /* Sunucunun verisi süzülür: yalnız http(s) link, her bölümde en çok üç. */
  const LINK_RE = /^https?:\/\/[^\s"'<>]+$/i;
  function arastirmaVeri(a){
    if(!a || a.sablon !== 'arastirma.v1') return null;
    const yazi = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 200);
    const link = v => LINK_RE.test(String(v || '')) ? String(v) : '';
    const izle = (Array.isArray(a.izle) ? a.izle : []).filter(v => v && link(v.link)).slice(0, 3).map(v => ({ no:Number(v.no) || null,
      baslik:yazi(v.baslik, 140), link:link(v.link), neden:yazi(v.neden, 200),
      bilgi:[yazi(v.kanal, 60), yazi(v.sure, 12), v.dil ? yazi(v.dil, 20) + (v.dil_etiket === 'tahmin' ? ' (tahmin)' : '') : '',
        v.an ? 'başlangıç ' + yazi(v.an, 10) : ''].filter(Boolean).join(' · ') }));
    const oku = (Array.isArray(a.oku) ? a.oku : []).filter(k => k && link(k.url)).slice(0, 3).map(k => ({ no:Number(k.no) || null,
      baslik:yazi(k.baslik, 140), link:link(k.url), site:yazi(k.site, 60), neden:yazi(k.neden, 220) }));
    const oz = a.ozet && typeof a.ozet === 'object' ? yazi(a.ozet.metin, 900) : '';
    const s = a.sonraki && a.sonraki.hedef ? a.sonraki.hedef : null;
    const hedef = s && (link(s.link) || link(s.url)) ? { baslik:yazi(s.baslik, 140), link:link(s.link) || link(s.url), kanal:yazi(s.kanal, 60) } : null;
    if(!oz && !izle.length && !oku.length) return null;
    return { konu:yazi(a.konu, 80) || 'konu', modul:yazi(a.modul, 8), ozet:oz, izle, oku, hedef };
  }
  function arastirmaHtml(m, n){
    const a = m.arastirma;
    if(!a) return '';
    const bag = (x, alt) => '<li class="king__ars-oge"><a class="king__ars-link" href="' + KI.kac(x.link) + '" target="_blank" rel="noopener noreferrer">'
      + (x.no ? '<span class="king__ars-no">' + x.no + '</span>' : '') + KI.kac(x.baslik) + '</a>'
      + (alt ? '<small>' + KI.kac(alt) + '</small>' : '') + (x.neden ? '<span>' + KI.kac(x.neden) + '</span>' : '') + '</li>';
    return '<div class="king__ars" role="group" aria-label="Araştırma: ' + KI.kac(a.konu) + '">'
      + '<div class="king__ars-bolum"><div class="king__ars-bas"><span class="king__ars-ad">Özet</span>'
      + (a.ozet ? '<button type="button" class="king__cip" data-king="ars-dinle:' + n + '">Dinle</button>' : '') + '</div>'
      + '<p>' + KI.kac(a.ozet || 'Kaynaklardan doğrulanmış kısa bir özet çıkaramadım; aşağıdaki kaynaklara bakabilirsin.') + '</p></div>'
      + (a.izle.length ? '<div class="king__ars-bolum"><span class="king__ars-ad">İzle</span><ul class="king__ars-liste">'
        + a.izle.map(v => bag(v, v.bilgi)).join('') + '</ul></div>' : '')
      + (a.oku.length ? '<div class="king__ars-bolum"><span class="king__ars-ad">Oku</span><ul class="king__ars-liste">'
        + a.oku.map(k => bag(k, k.site)).join('') + '</ul></div>' : '')
      + (a.hedef && KI.D() ? '<div class="king__ars-bolum king__ars-sonraki"><span class="king__ars-ad">Sıradaki adım</span>'
        + '<p>«' + KI.kac(a.hedef.baslik) + '» Defter’e kaynak olarak eklenebilir; onaylamadan eklenmez.</p>'
        + '<button type="button" class="king__cip" data-king="ars-ekle:' + n + '">Defter’e ekle</button></div>' : '')
      + '</div>';
  }
  /* «Defter’e ekle»: King'in not aracı, onay kartıyla (söz 36). */
  async function arastirmaEkle(n){
    const a = KI.akis[n] && KI.akis[n].arastirma, A = KI.ARAC();
    if(!a || !a.hedef || !A) return null;
    const h = a.hedef;
    const o = await A.onizle('not_ekle', { baslik:('Kaynak: ' + h.baslik).slice(0, 120),
      metin:(a.konu + ' için' + (h.kanal ? ' · ' + h.kanal : '') + '\n' + h.link).slice(0, 2000) }, { metin:'' });
    if(!o.ok){ KI.soyle('Defter’e ekleyemedim: ' + o.hata + '.'); return null; }
    return KI.aracKart(o);
  }
  function kartlarHtml(m){
    if(!m.kartlar || !m.kartlar.length) return '';
    return '<div class="king__kartlar" role="list">' + m.kartlar.map(x => '<div class="king__kart" role="listitem">'
      + '<span class="king__kart-ad">' + KI.kac(x.ad) + '</span>'
      + '<b class="king__kart-deger">' + (x.deger == null ? '—' : KI.kac(x.deger) + (x.birim ? '<small> ' + KI.kac(x.birim) + '</small>' : '')) + '</b>'
      + '<span class="king__kart-etiket' + (x.etiket === 'veri yok' ? ' is-yok' : x.etiket === 'tahmin' ? ' is-tahmin' : '') + '">' + KI.kac(x.etiket) + '</span>'
      + (x.alt ? '<small class="king__kart-alt">' + KI.kac(x.alt) + '</small>' : '') + KI.cizgi(x.seri) + '</div>').join('') + '</div>';
  }
  function soruHtml(m, n){
    if(!m.soru) return '';
    const q = m.soru, c = q.cevap;
    return '<div class="king__soru">'
      + '<p class="king__soru-metin">' + KI.kac(q.soru) + '</p>'
      + '<div class="king__soru-sec" role="group" aria-label="Şıklar">' + q.sec.map((s, k) => {
        const h = 'ABCDE'[k];
        const cls = c ? (h === c.dogru ? ' is-dogru' : h === c.harf ? ' is-yanlis' : '') : '';
        return '<button type="button" class="king__soru-sik' + cls + '"' + (c ? ' disabled' : '') + ' data-king="soru-cevap:' + n + ':' + h + '">'
          + '<b>' + h + '</b><span>' + KI.kac(s) + '</span></button>';
      }).join('') + '</div>'
      + (c ? '<p class="king__soru-sonuc' + (c.isabet ? ' is-dogru' : '') + '">' + (c.isabet ? 'Doğru.' : 'Doğru cevap ' + KI.kac(c.dogru) + '.')
        + (c.not ? ' ' + KI.kac(c.not) : '') + '</p>'
        + (c.cozum.length ? '<ul class="king__soru-cozum">' + c.cozum.map(x => '<li>' + KI.kac(x) + '</li>').join('') + '</ul>' : '') : '')
      + (q.not && !c ? '<small class="king__soru-kaynak">' + KI.kac(q.not) + '</small>' : '')
      + (q.kaynak ? '<small class="king__soru-kaynak">' + KI.kac(q.kaynak) + '</small>' : '') + '</div>';
  }
  /* Uzun cevapta hafif biçim: **kalın**, madde ve başlık işaretleri (metin önce kaçırılır). */
  function bicimli(s){
    return KI.kac(s).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/^[ \t]*[*-][ \t]+/gm, '• ').replace(/^#{1,4}[ \t]+/gm, '')
      .replace(/https?:\/\/(?:[^\s<>"'&]|&amp;)+/g, u => {
        /* Sondaki noktalama linkin parçası değil. */
        const son = u.match(/[.,;:!?)\]]+$/);
        const ad = son ? u.slice(0, -son[0].length) : u;
        return '<a href="' + ad + '" target="_blank" rel="noopener noreferrer">' + ad + '</a>' + (son ? son[0] : '');
      });
  }

  Object.assign(KI, { yetenekler, GRUP_SVG_MODUL, KART, kartAyar, kartYaz, kartSabitle, kartSus, kartTasi, kartEkle, kartSil, miniKutu, oneCikanlar, vitrinHtml, vitrinDizin, gorevListe, rutinListe, GORSEL, gorseller, gorselSakla, kutuphaneHtml, kutDizin, kartNiyeti, kartTemiz, kartIsle, soruCevapla, LINK_RE, arastirmaVeri, arastirmaHtml, arastirmaEkle, kartlarHtml, soruHtml, bicimli });
})();
