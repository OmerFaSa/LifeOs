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
      paylaşımı taşınmaz (tarayıcı her sayfada yeniden izin ister).
  19. SOHBET SENİN (depo sahibi, 2026-10-17: «yazarak da dinleyebileyim, ya da
      konuşarak kendim seçebileyim; geçmişi temizleyebileyim, bir yere
      kaydedebileyim, kaydettiğim yeri görebileyim»). Başlıktaki «Daha fazla»
      menüsü:
        Cevaplar   Otomatik (sesle sorana sesle) · Sesli (yazsan da okur) ·
                   Yazılı (konuşsan da susar). Seçim modüller arasında taşınır.
        Kaydet     günün sohbeti «Kayıtlı sohbetler»e girer: bu cihazda, bu
                   modülde (en çok 30); hiçbir sunucuya gitmez.
        Kayıtlar   listelenir, açılır, dosya olarak indirilir (İndirilenler),
                   kopyalanır, iki adımda silinir.
        Temizle    ekrandaki ve bu cihazdaki günün sohbeti silinir; «Geri
                   getir» kalır (küçük aksiyon, AGENTS §1.9).
      Ekranda son altı mesaj görünür; günün tamamı (en çok 120) saklanır,
      kayda o girer.
  20. YETKİ (depo sahibi, 2026-10-17: «King'in her şeye yetkisi olsun;
      kişinin kendi hesabı hariç»). Sistem içindeki değişiklik cümlesi
      LIFEOS.YETKI kataloğuna gider (brand/ortak/yetki.js): küçük eylem
      hemen uygulanır ve «Geri al» kalır; orta önizleme + «Onayla»; büyük
      ayrıntılı önizleme + «Onaylıyorum» (ya da düğme) + önce dönüş noktası.
      «evet» büyük eylemi uygulamaz. Hesap işi yapılmaz, söylenir. Sayfanın
      yeniden yüklenmesi gereken eylemden sonra King aynı sayfada küçük
      kutu olarak yeniden açılır.
  21. CEVAP SAKİN BELİRİR (depo sahibi, 2026-10-18: «tıkı tıkı seslerle
      yazma işi amatörce kalmış»; 2026-10-17'deki harf harf yazma ve tık
      sesi kalktı). Yeni cevap tek seferde gelir, satırları hafifçe
      belirir (yalnız saydamlık ve 4 piksellik kayma; ses yok, bulanıklık
      yok). Görünüm › Animasyonlar «Az»da belirme de yok.
  22. SENİ TANIR (depo sahibi, 2026-10-17, belgeler/ekip/KISI-PLANI.md:
      «King her şeyi öğrenecek»). Kişi modeli hafızanın kendisidir (kisi.js):
        · AÇIK BEYAN kendiliğinden yazılır («Balığı sevmem», «hobim satranç»;
          «sohbetten», kural motoru) ve «Not ettim · Geri al» denir. Cümle
          aynı zamanda veri ise (kahveyi severim, 2 bardak içtim) veri
          akışı sürer, beyan sessizce yazılır.
        · TANIŞMA: King tam açılınca, sohbet boşsa, günde en çok bir kısa
          soru sorar (en az bilinen alandan); cevap «senin sözün»dür; «Atla».
        · «⋯ › Beni nasıl tanıyorsun»: 14 alan, kaynağı, modülü; kendi
          modülünün kaydı silinir, elle eklenir. Öbür modüllerde
          öğrenilenler sunucudan gelir (sunucu sözü 24).
        · Hafıza komutları King'de de çalışır («hatırla: …», «3 unut»;
          «hafızam» ve «benim hakkımda ne biliyorsun» paneli açar).
        · Görüntü okuyan modele kişi özeti gider (depo sahibinin kararı:
          hassas alanlar dahil); teşhis ve yargı yasak istemde yazılı.
  23. ÇIKARIM ONAYLAR'DA (depo sahibi, 2026-10-17: «çıkarım yapsın,
      doğruysa sistem kaydetsin»; 2026-10-18: «sohbet arasında olmasın,
      Onaylar denilen yerde olsun; ‹doğru mu› gibisinden kabul edilsin»).
      Kurallar cikarim.js'te, veri modülden (`ayar.cikarimVeri`). King
      sohbette çıkarım SORMAZ: adaylar modülün Onaylar çekmecesinde kart
      olarak durur (`cikarimKarti`, `cikarimOnayla`). Karar:
        Doğru   → senin onayınla hafızaya (kaynak sen)
        Düzelt  → kendi cümlen «senin sözün» olur
        Yanlış  → bir daha sorulmaz
      «Beni yorumla» dersen King Onaylar'da kaç çıkarımın beklediğini
      söyler. Sohbetteki hiçbir mesaj çıkarım cevabı sayılmaz.
  24. SORMA / SOR (depo sahibi, 2026-10-17: «AYS'de şu verileri alırken artık
      bana sorma, SPİ'de sor gibi tercihler»). Kendi yazdığın veriyi King
      «ekleyeyim mi?» diye sorar; «SPİ'de uyku için artık sorma», «AYS'de
      veri alırken bana sorma» dersen o modülün o türünde (ya da hepsinde)
      doğrudan kaydeder ve «Geri al» bırakır (AGENTS §1.9: hangi küçük
      türlerin sormadan uygulanacağını kullanıcı ayarlar). «… için sor»
      geri alır. Modül söylenmezse bulunduğun modül. Tercih modüller arasında
      taşınır (lifeos.king.sorma, animasyon.js TASINAN). Gelecek zamanlı
      cümle («yiyeceğim») yine sorulur: yapılmamış iş kaydedilmez.
  25. KİŞİLİK ENVANTERİ VE ÜSLUP (KISI-PLANI Faz 4, envanter.js). «Kişilik
      testi» dersen King 20 maddelik Mini-IPIP'i (kamu malı) sohbet içinde
      tek tek sorar (1–5 düğmeleri ya da yazarak); «Bırak» her an. Bitince
      beş boyut yargısız dille kişilik alanına «senin sözün» olarak yazılır;
      yeniden yapılırsa eskisinin yerine geçer. Yazdığın her mesaj üslup
      sayacını artırır (yalnız sayı, metin saklanmaz); King üslubunu
      çıkarım olarak sorar, onaylarsan model istemine girer.
  26. SOHBET PENCERESİ (depo sahibi, 2026-10-18: «GPT arayüzü gibi; geçmiş
      konuşmaları görelim, türlü türlü araç ekleyelim; odak penceresi kalsın
      ama dört beş katı büyüsün, tam ekran olmasın»). Büyük King ortada,
      perdenin üstünde büyük bir odak penceresidir. Solda kenar çubuğu:
      «Yeni sohbet» (açık sohbet sessizce geçmişe yazılır), «Geçmiş» (bu
      cihazdaki sohbetler; dokununca o sohbet açılır ve oradan sürer) ve
      «Araçlar» (ARACLAR kataloğu: her araç bir data-king eylemidir; yenisi
      kataloğa bir satır eklenerek gelir). Önceki günün sohbeti açılışta
      kendiliğinden geçmişe geçer, kaybolmaz. Tablet ve telefonda kenar
      çubuğu başlıktaki düğmeyle açılır. Küçük King (söz 9) değişmez.
  27. KİPLER VE KLASÖRLER (depo sahibi, 2026-10-18: «sadeleştir,
      profesyonelleştir; King'i yalnız sesli duyabileyim, beraber
      konuşabileyim ya da ekran paylaşayım; solda yalnız sohbet geçmişi
      olsun, klasörleyebilelim»). Pencerenin üstünde dört kip:
        Yaz    yazarak; cevap yazılı (ayarlardaki cevap biçimi geçerli)
        Dinle  sen yazarsın, King her cevabı sesli okur
        Konuş  sesli sohbet: King konuşunca yeniden dinler (söz 13)
        Ekran  ekran paylaşımı: canlı önizleme, «Ne görüyorsun?», Durdur
      Kipler birbirini kapatır; yalnız cihazın desteklediği kip görünür.
      Sol çubukta yalnız sohbetler: arama, klasörler (oluştur, taşı,
      sil; klasör silinince sohbetler silinmez, «Sohbetler»e döner).
      Araçlar yazı alanındaki «+» menüsündedir (ARACLAR kataloğu).
      Sohbet yeniden adlandırılır (boş ad ilk soruya döner) ve sabitlenir;
      sabitlenenler en üstte «Sabitlenenler»dedir.
  28. GÜZEL SES (depo sahibi, 2026-10-19: «internete bağlıyken Gemini, yerelde
      Piper; PC, telefon, tablet hepsi; ayarlanabilsin»). HKM bağlıysa King
      cevabı HKM'den WAV olarak ister (/api/ses, HKM/core/ses.py): internet
      varsa Gemini'nin Türkçe sesi, yoksa PC'deki Piper. Alamazsa (HKM kapalı,
      ikisi de yok) söz 7'deki gibi cihazın kendi sesine düşer; King hiç
      susmaz. Seçim cihazda durur (Dinle ve Konuş panelinde «Ses»):
        Otomatik  Gemini → Piper → cihaz (varsayılan)
        Gemini    yalnız Gemini, olmazsa cihaz
        Piper     yalnız Piper (metin bilgisayardan çıkmaz), olmazsa cihaz
        Cihaz     yalnız cihazın sesi; HKM'ye ses isteği gitmez
      Gemini seçiliyken (Otomatik dahil) okunacak cevabın METNİ Google'a
      gider; bu söz 7'nin «metin hiçbir şirkete gitmez» sözünü o seçim için
      değiştirir ve panel bunu söyler. Uzun cevap parça parça istenir;
      biri çalarken sonraki hazırlanır. Sustur her şeyi keser.
      SES KİLİDİ (depo sahibi, 2026-10-19: «ses durduk yere Gemini'ye,
      Piper'a, cihaza geçiyor»): bir cevabın ilk parçasını hangi motor
      okuduysa sonraki parçalar O motordan istenir; Otomatik her parçada
      sırayı baştan denemez. O motor cevabın ortasında bir kez daha
      vermezse parça seçili tercihle bir kez daha istenir, o da olmazsa
      kalan cihazın sesiyle okunur. HKM motorun neden değiştiğini
      söylerse («Gemini kotası doldu») panel «Son okuyan»ın yanında yazar.
  30. DAHA PROFESYONEL (depo sahibi, 2026-10-19: «Konuş'ta aşağıda çıkan
      kutucuk rahatsız ediyor, Dinle'deki gibi minimal olsun; kenar çubuğu
      sola doğru küçülebilsin; King'in logosu daha profesyonel olsun»).
      Konuş kutusuz: yazı alanının üstünde ince bir şerit (küçük küre,
      durum, kapat). Ses seçimi ve «Son okuyan» ··· menüsündedir. Kenar
      çubuğu geniş ekranda da başlıktaki düğmeyle kapanır; tercih cihazda
      durur (lifeos.king.yan). Dar ekranda eskisi gibi pencerenin içinde
      açılır. Küre katmanlıdır (king.css): derinlik, parlama ve yavaş dönen
      iç akış; dinlerken ve konuşurken hızlanır, hareket azaltılmışsa durur.
  31. DÜŞÜNME DERİNLİĞİ (depo sahibi, 2026-10-19: «King ne kadar düşünecek
      seçilebilsin: hızlı cevaplasın, derin düşünsün»). Yazı alanındaki
      küçük düğme ve ··· menüsündeki «Düşünme» satırı:
        Otomatik  mesaja göre HKM seçer (varsayılan)
        Hızlı     kısa ve çabuk cevap (seviye alt)
        Dengeli   öneri ve yorum (seviye orta)
        Derin     seçenekleri tartar, gerekçeli öneri (seviye üst)
      Seçim cihazda durur (lifeos.king.derinlik; TASINAN'da) ve HKM'ye
      «derinlik» olarak gider (HKM/core/sohbet.py). Paket merdiveni varsa
      seviye modeli ve eforu seçer; elle atanmış tek modelde model
      değişmez, bağlamın genişliği ve cevabın biçimi değişir. Derin daha
      uzun sürebilir: bekleme süresi iki katıdır. Düğme yalnız Merkez
      (yapay zekâ) bağlıyken görünür; yerel King model kullanmaz. */

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
    /* Söz 30: kenar çubuğu geniş ekranda yerinde kapanır, darda üstte açılır. */
    genis:() => !(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:1023px)').matches),
    git:url => { window.location.href = url; },
    zamanla:(fn, ms) => setTimeout(fn, ms),
    simdi:() => new Date(),
    yenile:() => { try{ location.reload(); }catch(e){ /* yok */ } },
    /* Söz 22: öbür modüllerin kişi kayıtları (sunucu sözü 24); yoksa null. */
    kisiSunucu:async () => (L.HESAP && typeof L.HESAP.kisi === 'function' ? L.HESAP.kisi() : null),
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
    /* Söz 19: sohbet dosyası (düz metin) cihaza iner; olmazsa false. */
    indir:(ad, metin) => {
      try{
        const u = URL.createObjectURL(new Blob([metin], { type:'text/plain;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = u; a.download = ad; a.style.display = 'none';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 4000);
        return true;
      }catch(e){ return false; }
    },
    kopyala:async metin => {
      try{ await navigator.clipboard.writeText(metin); return true; }catch(e){ return false; }
    },
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
        video:v,
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
    /* Söz 29: mikrofonu kaydeder; sessizlikte `sessiz` çağrılır. Mikrofon yoksa null. */
    mikrofonlar:async () => {
      if(typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') return [];
      try{
        const l = await navigator.mediaDevices.enumerateDevices();
        return (l || []).filter(d => d && d.kind === 'audioinput' && d.deviceId)
          .map((d, i) => ({ id:d.deviceId, ad:String(d.label || '').trim() || ('Mikrofon ' + (i + 1)) }));
      }catch(e){ return []; }
    },
    kayitAc:(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ? async (sessiz, cihazId) => {
      const sesKisit = { echoCancellation:true, noiseSuppression:true };
      if(cihazId) sesKisit.deviceId = { ideal:cihazId };
      const akis = await navigator.mediaDevices.getUserMedia({ audio:sesKisit });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const kaynak = ctx.createMediaStreamSource(akis);
      const isle = ctx.createScriptProcessor(4096, 1, 1);
      const parca = [];
      let konustu = false, sessizN = 0, toplam = 0, bitti = false;
      isle.onaudioprocess = e => {
        const d = e.inputBuffer.getChannelData(0);
        parca.push(new Float32Array(d));
        toplam += d.length;
        let t = 0;
        for(let i = 0; i < d.length; i++) t += d[i] * d[i];
        if(Math.sqrt(t / d.length) > 0.02){ konustu = true; sessizN = 0; } else if(konustu) sessizN += d.length;
        const hz = ctx.sampleRate;
        if(!bitti && ((konustu && sessizN > hz * 1.4) || toplam > hz * 60 || (!konustu && toplam > hz * 8))) sessiz();
      };
      kaynak.connect(isle); isle.connect(ctx.destination);
      return { bitir:() => {
        bitti = true;
        try{ isle.disconnect(); kaynak.disconnect(); }catch(e){ /* kopuk */ }
        try{ akis.getTracks().forEach(t => t.stop()); }catch(e){ /* durmus */ }
        const hz = ctx.sampleRate;
        try{ ctx.close(); }catch(e){ /* kapali */ }
        const pcm = new Float32Array(toplam);
        let o = 0;
        parca.forEach(p => { pcm.set(p, o); o += p.length; });
        return { pcm, hz, konustu };
      } };
    } : null,
    /* Söz 28: sunucunun WAV'ını çalar. Döner: 'bitti' | 'olmadi' (çalınamadı:
       tarayıcı izin vermedi ya da dosya bozuk). `tut` durdurucuyu alır. */
    oynat:(blob, tut, h) => new Promise(ok => {
      if(typeof Audio !== 'function' || typeof URL === 'undefined') return ok('olmadi');
      let u = null, bitti = false, basladi = false;
      const son = s => { if(bitti) return; bitti = true; try{ URL.revokeObjectURL(u); }catch(e){} ok(s); };
      try{
        u = URL.createObjectURL(blob);
        const a = new Audio(u);
        a.playbackRate = h || 1;
        a.onplaying = () => { basladi = true; };
        a.onended = () => son('bitti');
        a.onerror = () => son(basladi ? 'bitti' : 'olmadi');
        tut({ dur:() => { try{ a.pause(); }catch(e){} son('bitti'); } });
        const p = a.play();
        if(p && p.catch) p.catch(() => son('olmadi'));
      }catch(e){ son('olmadi'); }
    }),
  };
  /* HKM'deki King'in modelli cevabı yerel modelde saniyeler sürebilir. */
  const MERKEZ_ZAMAN_ASIMI = 60000;

  let ayar = null;           // { modul, git(route, ek), ozet(), veri:{ onizle(metin) }, hkm() → Beacon }
  let acik = false;
  let akis = [];             // [{ kim:'king'|'sen', metin, satirlar? }]
  let cipler = null;         // null = hazır cevaplar; ya da [{ ad, is }]
  let bekleyen = null;       // veri önizlemesi
  let bekleyenGit = null;    // «açayım mı?» diye sorulan sayfa (söz 8)
  let yanAcik = false;       // söz 26: dar ekranda kenar çubuğu açık mı
  const YAN = 'lifeos.king.yan';   // söz 30: geniş ekranda kenar çubuğu kapalı mı ('dar')
  function yanDar(){ return ortam.depo.oku(YAN) === 'dar'; }
  function yanDarSec(dar){
    if(dar) ortam.depo.yaz(YAN, 'dar'); else ortam.depo.sil(YAN);
    ciz(false);
    return yanDar();
  }
  function yanDugme(){
    if(ortam.genis()) yanDarSec(!yanDar());
    else{ yanAcik = !yanAcik; ciz(false); }
  }
  let aktifKayit = null;     // söz 26: geçmişten açılan sohbetin kimliği
  let aracAcik = false;      // söz 27: «+» menüsü açık mı
  let klasorYeni = false;    // söz 27: yeni klasör adı soruluyor mu
  let tasinan = null;        // söz 27: klasöre taşınacak sohbetin kimliği
  let adlandirilan = null;   // söz 27: yeniden adlandırılan sohbetin kimliği
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
  const CEVAP = 'lifeos.king.cevap';   // söz 19: 'oto' | 'ses' | 'yazi'; TASINAN'da
  const SES = 'lifeos.king.ses';       // söz 28: 'oto' | 'gemini' | 'piper' | 'cihaz'; TASINAN'da
  const SES_TERCIH = ['oto', 'gemini', 'piper', 'cihaz'];
  const SES_AD = { oto:'Otomatik', gemini:'Gemini', piper:'Piper', cihaz:'Cihaz' };
  const SES_IP = { oto:'İnternet varsa Gemini, yoksa bilgisayardaki Piper, o da yoksa cihazın sesi',
    gemini:'Gemini’nin Türkçe sesi; metin Google’a gider', piper:'Bilgisayardaki Piper; metin bilgisayardan çıkmaz',
    cihaz:'Yalnız bu cihazın kendi sesi' };
  const SES_PARCA = 420;
  const ALGILA = 'lifeos.king.algila';   // soz 29: 'oto' | 'whisper' | 'ai' | 'tarayici'; TASINAN'da
  const ALGILA_TERCIH = ['oto', 'whisper', 'ai', 'tarayici'];
  const ALGILA_AD = { oto:'Otomatik', whisper:'Whisper', ai:'Yapay zekâ', tarayici:'Uygulama' };
  const ALGILA_IP = { oto:'Bu bilgisayarda Whisper varsa o, yoksa yapay zekâ',
    whisper:'Yalnız Whisper: ücretsiz, ses bilgisayardan çıkmaz', ai:'Yalnız yapay zekâ (Gemini): ses Google’a gider',
    tarayici:'Uygulamanın (tarayıcının) kendi tanıması' };
  function algila(){ const v = ortam.depo.oku(ALGILA); return ALGILA_TERCIH.indexOf(v) > 0 ? v : 'oto'; }
  const MIK = 'lifeos.king.mik';         // soz 29: secili mikrofon (deviceId); TASINAN'da
  let mikListe = [];                     // [{ id, ad }]
  let mikDeniyor = null;                 // { dur:fn, iptal:fn } | null
  let mikNot = '';                       // son mikrofon denemesi sonucu
  function mikSecili(){ const v = ortam.depo.oku(MIK); return typeof v === 'string' ? v : ''; }
  function mikSec(id){
    const v = String(id || '').trim();
    if(!v) ortam.depo.sil(MIK); else ortam.depo.yaz(MIK, v);
    mikNot = '';
    ciz(false);
    return true;
  }
  async function mikTazele(){
    if(typeof ortam.mikrofonlar !== 'function') return [];
    try{ mikListe = (await ortam.mikrofonlar()) || []; }catch(e){ mikListe = []; }
    if(acik && menu === 'menu') ciz(false);
    return mikListe;
  }
  const DERIN = 'lifeos.king.derinlik';   // söz 31: 'oto' | 'hizli' | 'dengeli' | 'derin'; TASINAN'da
  const DERIN_TERCIH = ['oto', 'hizli', 'dengeli', 'derin'];
  const DERIN_AD = { oto:'Otomatik', hizli:'Hızlı', dengeli:'Dengeli', derin:'Derin' };
  const DERIN_IP = { oto:'Mesaja göre King seçer', hizli:'Kısa ve çabuk cevap',
    dengeli:'Öneri ve yorum, orta uzunlukta', derin:'Seçenekleri tartar, gerekçeli öneri; biraz daha uzun sürer' };
  let derinAcik = false;                 // söz 31: yazı alanındaki derinlik menüsü açık mı
  function derinlik(){ const v = ortam.depo.oku(DERIN); return DERIN_TERCIH.indexOf(v) > 0 ? v : 'oto'; }
  function derinlikSec(v){
    if(DERIN_TERCIH.indexOf(v) < 0) return false;
    if(v === 'oto') ortam.depo.sil(DERIN); else ortam.depo.yaz(DERIN, v);
    derinAcik = false;
    ciz(false);
    return true;
  }
  const HIZ = 'lifeos.king.hiz';       // okuma hizi; TASINAN'da
  const HIZLAR = [1, 1.15, 1.3, 1.5, 1.75];
  function hiz(){ const v = Number(ortam.depo.oku(HIZ)); return HIZLAR.indexOf(v) >= 0 ? v : 1; }               // sunucudan istenen bir parçanın en çok harfi
  const GUNLUK_EN_COK = 120, ARSIV_EN_COK = 30;
  let menu = null;            // söz 19: null | 'menu' | 'kayitlar' | { id }
  let silOnay = null;         // söz 19: silinmek üzere seçilen kayıt
  let silinen = null;         // söz 19: temizlenen sohbet («Geri getir»)
  let bekleyenYetki = null;   // söz 20: onay bekleyen orta/büyük eylem
  let bekleyenTanisma = null; // söz 22: { alan, soru }
  let disKisi = [];           // söz 22: öbür modüllerin kişi kayıtları [{ modul, kayitlar }]
  let kisiYeni = { alan:'sevgi', metin:'' };   // söz 22: paneldeki ekleme formu
  const TANISMA = 'lifeos.king.tanisma';
  const CIKARIM_KARAR = 'lifeos.king.cikarim';   // söz 23: { id:'dogru'|'kismen'|'yanlis' }
  const SORMA = 'lifeos.king.sorma';
  const USLUP = 'lifeos.king.uslup';           // söz 25: üslup sayacı
  let envanter = null;                          // söz 25: { i, cevaplar }           // söz 24: { ays:{ '*':true, uyku:false }, spi:{…} }
  const FOTO_EN_BUYUK = 15 * 1024 * 1024;
  let sesli = false;         // son istek sesle geldiyse cevap da sesle (söz 7)
  let dinleyen = null;       // çalışan tanıma oturumu
  let konusuyor = 0;         // okunmayı bekleyen parça sayısı
  let sesNo = 0;             // söz 28: her yeni okuma eskisini geçersiz kılar
  let calan = null;          // çalan sunucu sesi ({ dur })
  let sonMotor = '';         // son okumayı kim yaptı: gemini | piper | cihaz
  let sonNot = '';           // söz 28: HKM'nin «neden bu motor» notu (X-Ses-Not)

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
      const r = await M.complete(zincir, { system:GORSEL_SISTEM + (kisiOzeti() ? '\n\n' + kisiOzeti() : ''), temperature:0.3, maxTokens:700,
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
    const d = derinlik();
    /* Söz 31: Derin daha uzun sürebilir; bekleme iki katı. */
    const t = ctrl ? setTimeout(() => ctrl.abort(), MERKEZ_ZAMAN_ASIMI * (d === 'derin' ? 2 : 1)) : null;
    try{
      /* fetch bir nesnenin yöntemi olarak çağrılamaz («Illegal invocation»). */
      const f = ortam.fetch;
      const govde = { text:String(metin).trim(), agent:'king', date:bugunISO() };
      if(d !== 'oto') govde.derinlik = d;
      const res = await f(k.url + '/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify(govde),
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
    sesNo++;
    if(calan){ const c = calan; calan = null; try{ c.dur(); }catch(e){ /* durmuş */ } }
    const sz = ortam.sentez();
    if(sz) try{ sz.cancel(); }catch(e){ /* yok */ }
    konusuyor = 0;
    durum();
  }
  /* Söz 28: sesi kim okusun. */
  function sesTercihi(){ const v = ortam.depo.oku(SES); return SES_TERCIH.indexOf(v) > 0 ? v : 'oto'; }
  function sesTercihSec(v){
    if(SES_TERCIH.indexOf(v) < 0) return false;
    if(v === 'oto') ortam.depo.sil(SES); else ortam.depo.yaz(SES, v);
    ciz(false);
    return true;
  }
  /* Kısa cümleleri SES_PARCA harfe kadar birleştirir: her parça bir istek. */
  function sesParcalari(metin){
    return parcala(metin).reduce((l, p) => {
      if(l.length && (l[l.length - 1] + ' ' + p).length <= SES_PARCA) l[l.length - 1] += ' ' + p; else l.push(p);
      return l;
    }, []);
  }
  async function sesGetir(k, metin, tercih){
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), 30000) : null;
    try{
      const f = ortam.fetch;
      const res = await f(k.url + '/api/ses', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ metin, tercih:tercih || sesTercihi() }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      if(res.status !== 200 || typeof res.blob !== 'function') return null;
      const baslik = h => (res.headers && res.headers.get && res.headers.get(h)) || '';
      let not = baslik('X-Ses-Not');
      try{ not = decodeURIComponent(not); }catch(e){ /* düz kalır */ }
      return { blob:await res.blob(), motor:baslik('X-Ses-Motor'), not };
    }catch(e){
      return null;
    }finally{
      if(t) clearTimeout(t);
    }
  }
  /* Doner: true (okundu ya da kesildi) | false (ilk parça bile gelmedi: cihaza düş). */
  async function sunucuSesi(k, metin, no){
    const parcalar = sesParcalari(metin);
    const tercih = sesTercihi();
    let kilit = '';            // ses kilidi: ilk parçayı okuyan motor
    let sonraki = sesGetir(k, parcalar[0], tercih);
    for(let i = 0; i < parcalar.length; i++){
      let r = await sonraki;
      if(no !== sesNo) return true;
      if(!r && i > 0 && kilit && kilit !== tercih){
        r = await sesGetir(k, parcalar[i], tercih);
        if(no !== sesNo) return true;
      }
      if(r && r.motor){
        if(r.motor !== kilit || r.not) sonNot = r.not || '';
        kilit = r.motor;
      }
      sonraki = r && i + 1 < parcalar.length ? sesGetir(k, parcalar[i + 1], kilit || tercih) : null;
      const s = r ? await ortam.oynat(r.blob, c => { calan = c; }, hiz()) : 'olmadi';
      calan = null;
      if(no !== sesNo) return true;
      if(s !== 'bitti'){
        if(i === 0) return false;
        cihazSesi(parcalar.slice(i).join(' '));
        return true;
      }
      if(r.motor) sonMotor = r.motor;
    }
    konusuyor = 0;
    durum();
    sohbetDevam();
    return true;
  }
  function seslendir(metin){
    if(!metin) return;
    sus();
    const no = sesNo;
    const k = sesTercihi() === 'cihaz' ? null : baglanti();
    if(!k || !ortam.oynat){ cihazSesi(metin); return; }
    konusuyor = 1;
    durum();
    sunucuSesi(k, metin, no).then(ok => { if(!ok && no === sesNo) cihazSesi(metin); },
      () => { if(no === sesNo) cihazSesi(metin); });
  }
  function cihazSesi(metin){
    const sz = ortam.sentez();
    if(!sz || !metin){ konusuyor = 0; durum(); return; }
    try{ sz.cancel(); }catch(e){ /* yok */ }
    if(sonMotor !== 'cihaz') sonNot = '';
    sonMotor = 'cihaz';
    const ses = sesSec(sz.getVoices ? sz.getVoices() : []);
    const parcalar = parcala(metin);
    konusuyor = parcalar.length;
    parcalar.forEach(p => {
      const u = ortam.soz(p);
      u.lang = 'tr-TR';
      if(ses) u.voice = ses;
      u.rate = 1.03 * hiz();
      u.onend = u.onerror = () => { konusuyor = Math.max(0, konusuyor - 1); durum(); if(!konusuyor) sohbetDevam(); };
      try{ sz.speak(u); }catch(e){ konusuyor = 0; }
    });
    durum();
  }

  function dinle(){
    if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } return; }
    const hk = !hkmDinlemez && ortam.kayitAc && algila() !== 'tarayici' ? baglanti() : null;
    if(hk){ kayitDinle(hk); return; }
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
    r.onend = () => { dinleyen = null; durum(); tanindi(son, hata); };
    dinleyen = r;
    try{ r.start(); }catch(e){ dinleyen = null; }
    durum();
  }
  /* Tanima bitti (tarayici ya da HKM): metin ya da hata. */
  function tanindi(son, hata){
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
  }

  /* Söz 29 (2026-10-19): HKM bağlıysa konuşma kaydedilir ve HKM yazıya döker:
     bu PC'de Whisper varsa o (ücretsiz, ses çıkmaz), yoksa Gemini. HKM ikisini
     de bulamazsa bir kez söylenir ve sonraki dinlemeler tarayıcının tanımasıyla
     yapılır. Kayıt sessizlikte (1,4 sn) kendiliğinden biter. */
  let hkmDinlemez = false;
  function wavYap(pcm, hz){
    const ORAN = 16000, n = Math.max(0, Math.floor(pcm.length * ORAN / hz));
    const v = new DataView(new ArrayBuffer(44 + n * 2));
    const yaz = (o, m) => { for(let i = 0; i < m.length; i++) v.setUint8(o + i, m.charCodeAt(i)); };
    yaz(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); yaz(8, 'WAVEfmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, ORAN, true); v.setUint32(28, ORAN * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); yaz(36, 'data'); v.setUint32(40, n * 2, true);
    for(let i = 0; i < n; i++){
      const x = Math.max(-1, Math.min(1, pcm[Math.min(pcm.length - 1, Math.floor(i * hz / ORAN))] || 0));
      v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
    }
    const b = new Uint8Array(v.buffer);
    let ikili = '';
    for(let i = 0; i < b.length; i += 0x8000) ikili += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(ikili);
  }
  async function yaziyaDok(k, wav){
    try{
      const f = ortam.fetch;
      const res = await f(k.url + '/api/dinle', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token }, body:JSON.stringify({ wav, tercih:algila() }) });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      if(res.status === 200 && g && typeof g.metin === 'string') return g.metin;
      if(res.status === 503) hkmDinlemez = true;
      return null;
    }catch(e){ return null; }
  }
  async function kayitDinle(k){
    sus();
    let kayit = null, bitti = false;
    const sonlandir = async () => {
      if(bitti) return;
      bitti = true;
      const r = kayit ? kayit.bitir() : null;
      dinleyen = null;
      durum();
      if(!r || !r.konustu){ tanindi('', 'no-speech'); return; }
      const g = typeof document !== 'undefined' ? document.querySelector('.king__girdi') : null;
      const eski = g ? g.placeholder : '';
      if(g) g.placeholder = 'Yazıya dökülüyor…';
      const t = await yaziyaDok(k, wavYap(r.pcm, r.hz));
      if(g) g.placeholder = eski;
      if(t === null){
        soyle(hkmDinlemez ? 'Bu bilgisayarda Whisper yok, Gemini de hazır değil; bundan sonra tarayıcının tanımasını deneyeceğim.'
          : 'Ses yazıya dökülemedi; yazarak da sorabilirsin.');
        return;
      }
      tanindi(t, t ? '' : 'no-speech');
    };
    dinleyen = { stop:sonlandir, abort:() => { bitti = true; if(kayit) try{ kayit.bitir(); }catch(e){} dinleyen = null; durum(); } };
    durum();
    try{ kayit = await ortam.kayitAc(() => { sonlandir(); }, mikSecili()); }
    catch(e){ bitti = true; dinleyen = null; durum(); tanindi('', 'not-allowed'); return; }
    if(bitti && kayit) try{ kayit.bitir(); }catch(e){ /* durmus */ }
  }
  async function mikDene(){
    if(mikDeniyor){ const d = mikDeniyor; mikDeniyor = null; d.dur(); return; }
    if(!ortam.kayitAc){
      mikNot = 'Bu tarayıcıda doğrudan mikrofon kaydı desteklenmiyor.';
      ciz(false);
      return;
    }
    sus();
    let kayit = null, bitti = false, sayac = null;
    const sonlandir = async () => {
      if(bitti) return;
      bitti = true;
      if(sayac) clearTimeout(sayac);
      mikDeniyor = null;
      const r = kayit ? kayit.bitir() : null;
      if(!r || !r.konustu){
        mikNot = 'Ses duyulmadı — mikrofona konuşup tekrar dene ya da başka bir mikrofon seç.';
        ciz(false);
        return;
      }
      const hk = algila() !== 'tarayici' ? baglanti() : null;
      if(hk){
        mikNot = 'Ses alındı · yazıya dökülüyor…';
        ciz(false);
        const t = await yaziyaDok(hk, wavYap(r.pcm, r.hz));
        mikNot = t ? 'Mikrofon çalışıyor · «' + t + '»'
          : t === '' ? 'Mikrofon ses aldı, ancak konuşma seçilemedi.'
          : 'Mikrofon ses aldı, ancak HKM yazıya dökemedi.';
      }else{
        mikNot = 'Mikrofon çalışıyor · ses alındı.';
      }
      ciz(false);
    };
    const iptal = () => {
      if(bitti) return;
      bitti = true;
      if(sayac) clearTimeout(sayac);
      mikDeniyor = null;
      if(kayit) try{ kayit.bitir(); }catch(e){ /* durmus */ }
    };
    mikDeniyor = { dur:sonlandir, iptal };
    mikNot = 'Dinliyorum… bir cümle söyle (durunca ya da Bitir’e basınca biter).';
    ciz(false);
    try{
      kayit = await ortam.kayitAc(() => { sonlandir(); }, mikSecili());
      mikTazele();
      sayac = ortam.zamanla(() => { sonlandir(); }, 5000);
    }catch(e){
      bitti = true;
      if(sayac) clearTimeout(sayac);
      mikDeniyor = null;
      mikNot = 'Mikrofon açılamadı — tarayıcı iznini ya da seçili mikrofonu kontrol et.';
      ciz(false);
    }
    if(bitti && kayit) try{ kayit.bitir(); }catch(e){ /* durmus */ }
  }

  /* Söz 15: aynı günün son mesajları bu cihazda. */
  const depoAnahtar = () => 'king.sohbet.' + ((ayar && ayar.modul) || 'x');
  function sakla(){
    if(!ayar) return;
    const l = akis.filter(m => !m.bekliyor).slice(-GUNLUK_EN_COK).map(m => ({ kim:m.kim, metin:m.foto ? '(fotoğraf)' : (m.metin || ''),
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

  /* ---------- söz 19: cevap biçimi ve sohbet kayıtları ---------- */
  /* ---------- söz 22: seni tanır ---------- */
  function hafiza(){ try{ return ayar && typeof ayar.hafiza === 'function' ? ayar.hafiza() : null; }catch(e){ return null; } }
  const KISI = () => L.KISI || null;
  function kendiKayitlar(){ const H = hafiza(); try{ return H ? H.etkin() : []; }catch(e){ return []; } }
  function kisiKayitlari(){
    const kendi = kendiKayitlar().map(k => Object.assign({ modul:ayar.modul, kendi:true }, k));
    const dis = [];
    disKisi.filter(m => m.modul !== ayar.modul).forEach(m => (m.kayitlar || []).forEach(k => {
      if(k && typeof k.metin === 'string') dis.push(Object.assign({}, k, { modul:m.modul, kendi:false }));
    }));
    return kendi.concat(dis);
  }
  async function disKisiTazele(){
    try{
      const r = ortam.kisiSunucu ? await ortam.kisiSunucu() : null;
      disKisi = r && Array.isArray(r.moduller) ? r.moduller : disKisi;
    }catch(e){ /* sunucu kapalı: bildiğiyle devam (AGENTS §1.4) */ }
    return disKisi;
  }
  /* Beyan yazılır; döner: kayıt ya da null. */
  async function beyanYaz(b){
    const H = hafiza();
    if(!H || !b) return null;
    const r = await H.ekle(b.metin, { katman:'sohbet', kaynak:'kural', alan:b.alan });
    return r && r.ok ? r.kayit : null;
  }
  function kisiOzeti(){
    const K = KISI();
    return K ? K.ozet(kisiKayitlari()) : '';
  }
  function tanismaHazirla(){
    const K = KISI(), H = hafiza();
    if(!K || !H || akis.length) return false;
    const bugun = bugunISO();
    const q = K.tanismaSorusu(kisiKayitlari(), bugun, ortam.depo.oku(TANISMA));
    if(!q) return false;
    ortam.depo.yaz(TANISMA, bugun);
    bekleyenTanisma = q;
    akis.push({ kim:'king', metin:'Seni biraz daha tanımak istiyorum: ' + q.soru, son:'Yaz ya da söyle; istemezsen «Atla».' });
    cipler = [{ is:'tanisma-atla', ad:'Atla' }];
    return true;
  }
  async function tanismaCevapla(metin){
    const q = bekleyenTanisma, K = KISI(), H = hafiza();
    bekleyenTanisma = null; cipler = null;
    const m = K && q ? K.cevapMetni(q.soru, metin) : null;
    if(!m || !H){ soyle('Tamam.'); return; }
    const r = await H.ekle(m, { katman:'soz', kaynak:'kullanici', alan:q.alan });
    if(r && r.ok){
      sonGeriAl = async () => { await H.unut(r.kayit.id); };
      cipler = [{ is:'geri-al', ad:'Geri al' }];
      soyle('Teşekkürler, not ettim. Seni «' + K.BY_ID[q.alan].ad + '» altında daha iyi tanıyorum.');
    }else soyle(r && r.why ? r.why : 'Not edemedim.');
  }

  /* ---------- söz 25: kişilik envanteri ---------- */
  const ENV = () => L.ENVANTER || null;
  const ENV_BASLA = /(kişilik (testi|envanteri|testimi)|kişiliğimi (ölç|test et|analiz et)|beni test et|beş faktör)/;
  function envanterSor(){
    const E = ENV(), i = envanter.i;
    cipler = E.CEVAPLAR.map((ad, k) => ({ is:'env:' + (k + 1), ad:(k + 1) + ' · ' + ad })).concat([{ is:'env-dur', ad:'Bırak' }]);
    soyle('(' + (i + 1) + '/' + E.MADDELER.length + ') ' + E.MADDELER[i][0], null, null, 'Sana ne kadar uyuyor?');
  }
  function envanterBasla(){
    if(!ENV() || !hafiza()) return false;
    envanter = { i:0, cevaplar:[] };
    akis.push({ kim:'king', metin:'Kısa bir kişilik envanteri yapalım: 20 cümle, her biri için 1 (hiç katılmıyorum) ile 5 (tamamen katılıyorum) arasında seç. '
      + 'Doğru ya da yanlış cevap yok; istediğin an «Bırak».' });
    envanterSor();
    return true;
  }
  function envanterCevap(metin){
    const E = ENV();
    const t = kucuk(metin).replace(/[.!]+$/, '');
    let c = /^[1-5]$/.test(t) ? Number(t) : null;
    if(c == null){ const k = E.CEVAPLAR.findIndex(x => x.toLocaleLowerCase('tr') === t); if(k >= 0) c = k + 1; }
    return c;
  }
  async function envanterIlerle(c){
    const E = ENV(), H = hafiza();
    envanter.cevaplar[envanter.i] = c;
    envanter.i++;
    if(envanter.i < E.MADDELER.length){ envanterSor(); return; }
    const sonuc = E.puanla(envanter.cevaplar);
    envanter = null; cipler = null;
    const satir = E.satirlar(sonuc.puan);
    if(H){
      for(const k of H.etkin().filter(x => /Kaynak: kişilik envanteri/.test(x.metin))) await H.unut(k.id);
      for(const m of satir) await H.ekle(m, { katman:'soz', kaynak:'kullanici', alan:'kisilik' });
    }
    soyle('Bitti, teşekkürler. Cevaplarına göre:', satir.map(x => x.split(' Kaynak:')[0]),
      null, 'Bunlar test günü cevaplarındır; zamanla değişebilir. «Beni nasıl tanıyorsun»da görebilir, silebilirsin.');
  }

  /* ---------- söz 24: sorma / sor ---------- */
  const SORMA_TUR = [
    [/uyku/, 'uyku'], [/(?<![a-zçğıöşü])su(?![a-zçğıöşü])/, 'su'], [/kilo|ölçüm|nabız|tansiyon|hrv/, 'olcum'],
    [/öğün|yemek|beslen/, 'ogun'], [/hareket|antrenman|spor|egzersiz/, 'hareket'], [/tahlil/, 'tahlil'],
    [/soru|çalışma|deneme|blok/, 'calisma'], [/oturum|pratik/, 'oturum'],
  ];
  const SORMA_AD = { '*':'bütün veriler', uyku:'uyku', su:'su', olcum:'ölçümler', ogun:'öğünler', hareket:'hareket',
    tahlil:'tahliller', calisma:'çalışma ve sorular', oturum:'oturumlar' };
  function sormaOku(){ const v = ortam.depo.oku(SORMA); return v && typeof v === 'object' ? v : {}; }
  function sormaMi(tur){
    const m = sormaOku()[ayar && ayar.modul] || {};
    if(tur && m[tur] === false) return false;
    return (tur && m[tur] === true) || m['*'] === true;
  }
  /* «SPİ'de uyku için artık sorma» → { modul, tur, sorma } ya da null. */
  function sormaKomutu(metin){
    const t = kucuk(metin);
    const sorma = /(sorma(dan|yı bırak|yacaksın)?|onay isteme|direkt (ekle|kaydet)|doğrudan (ekle|kaydet))(?![a-zçğıöşü])/.test(t)
      && !/sorma(mı|lı)/.test(t);
    const sor = !sorma && /(bana |yine |tekrar |her seferinde )?(sor|onay iste|sorarak ekle)(?![a-zçğıöşü])/.test(t);
    if(!sorma && !sor) return null;
    const tur = (SORMA_TUR.find(([re]) => re.test(t)) || [])[1] || null;
    const modul = /(?<![a-zçğıöşü])ays|sınav/.test(t) ? 'ays' : /(?<![a-zçğıöşü])sp[iı]|sağlık/.test(t) ? 'spi'
      : /(?<![a-zçğıöşü])esp|gelişim/.test(t) ? 'esp' : null;
    /* Yalnız «sor» kelimesi yetmez: tür, modül ya da «veri / kayıt / ekle» geçmeli. */
    if(!tur && !modul && !/veri|kayıt|ekle|kaydet/.test(t)) return null;
    return { modul:modul || (ayar && ayar.modul), tur:tur || '*', sorma };
  }
  function sormaUygula(k){
    const v = sormaOku();
    const m = Object.assign({}, v[k.modul] || {});
    if(k.tur === '*'){ Object.keys(m).forEach(x => { delete m[x]; }); if(k.sorma) m['*'] = true; }
    else if(k.sorma) m[k.tur] = true;
    else if(m['*']) m[k.tur] = false; else delete m[k.tur];
    v[k.modul] = m;
    if(!Object.keys(m).length) delete v[k.modul];
    if(Object.keys(v).length) ortam.depo.yaz(SORMA, v); else ortam.depo.sil(SORMA);
    const ad = MODUL_AD[k.modul] + '’de ' + SORMA_AD[k.tur];
    return k.sorma
      ? 'Tamam: ' + ad + ' için artık sormadan ekleyeceğim; her kaydın yanında «Geri al» olacak. Tekrar sormamı istersen «' + MODUL_AD[k.modul] + '’de ' + SORMA_AD[k.tur] + ' için sor» de.'
      : 'Tamam: ' + ad + ' için yine soracağım.';
  }
  function sormaListesi(){
    const v = sormaOku(), l = [];
    Object.keys(v).forEach(mod => Object.keys(v[mod]).forEach(t => { if(v[mod][t] === true) l.push(MODUL_AD[mod] + ' · ' + SORMA_AD[t]); }));
    return l;
  }

  /* ---------- söz 23: çıkarım sorar ---------- */
  function cikarimAdaylari(){
    const C = L.CIKARIM;
    if(!C || !hafiza()) return [];
    let v = {};
    try{ v = (ayar.cikarimVeri ? ayar.cikarimVeri() : {}) || {}; }catch(e){ v = {}; }
    const ses = C.sesVerisi ? C.sesVerisi() : null;
    if(ses && !v.ses) v = Object.assign({}, v, { ses });
    const us = ENV() ? ENV().uslupOzeti(ortam.depo.oku(USLUP)) : null;
    if(us) v = Object.assign({}, v, { uslup:us });
    return C.uret(v, ortam.depo.oku(CIKARIM_KARAR) || {});
  }
  /* Onaylar kartı: modülün Onaylar çekmecesi çizer, düğmeler `cikarim-karar`
     (data-id, data-karar) ile cikarimOnayla'ya gelir. Metin koddan; kaçışlı. */
  function cikarimKarti(en){
    const l = cikarimAdaylari().slice(0, en || 3);
    if(!l.length) return '';
    return '<div class="cikarimlar" data-cikarimlar>'
      + l.map(a => '<div class="cikarim" data-cikarim="' + kac(a.id) + '">'
        + '<p class="cikarim__soru">' + kac(a.soru) + '</p>'
        + '<p class="cikarim__kanit">Dayanağı: ' + kac(a.kanit) + '</p>'
        + '<div class="cikarim__eylem">'
        + '<button type="button" class="btn btn--sm btn--primary" data-act="cikarim-karar" data-id="' + kac(a.id) + '" data-karar="dogru"><span class="btn__label">Doğru, kaydet</span></button>'
        + '<button type="button" class="btn btn--sm" data-act="cikarim-karar" data-id="' + kac(a.id) + '" data-karar="yanlis"><span class="btn__label">Yanlış, bir daha sorma</span></button>'
        + '</div>'
        + '<details class="cikarim__duzelt"><summary>Kendi cümlemle düzelt</summary>'
        + '<input type="text" class="input" maxlength="240" aria-label="Kendi cümlen" data-cikarim-metin="' + kac(a.id) + '" placeholder="Örneğin: felsefe değil, tarih seviyorum">'
        + '<button type="button" class="btn btn--sm" data-act="cikarim-karar" data-id="' + kac(a.id) + '" data-karar="kismen"><span class="btn__label">Cümlemi kaydet</span></button>'
        + '</details></div>').join('')
      + '</div>';
  }
  function cikarimKararYaz(id, durum){
    const k = ortam.depo.oku(CIKARIM_KARAR) || {};
    k[id] = durum;
    ortam.depo.yaz(CIKARIM_KARAR, k);
  }
  /* Doner: { ok, metin, geriAl? }. Aday artık yoksa (karar verilmiş, veri
     değişmiş) hiçbir şey yazılmaz. */
  async function cikarimOnayla(id, durum, metin){
    const a = cikarimAdaylari().find(x => x.id === id), H = hafiza();
    if(!a || ['dogru', 'yanlis', 'kismen'].indexOf(durum) < 0) return { ok:false, metin:'Bu çıkarım artık geçerli değil.' };
    if(durum === 'yanlis'){ cikarimKararYaz(id, 'yanlis'); return { ok:true, metin:'Bıraktım; bu çıkarımı bir daha sormayacağım.' }; }
    const m = durum === 'kismen' ? String(metin || '').replace(/\s+/g, ' ').trim() : a.kayit;
    if(!m) return { ok:false, metin:'Önce kendi cümleni yaz.' };
    if(!H) return { ok:false, metin:'Hafıza bu cihazda kapalı.' };
    const r = await H.ekle(m, durum === 'kismen' ? { katman:'soz', kaynak:'kullanici', alan:a.alan }
      : { katman:'sohbet', kaynak:'kullanici', alan:a.alan });
    if(!(r && r.ok)) return { ok:false, metin:(r && r.why) || 'Kaydedemedim.' };
    cikarimKararYaz(id, durum);
    return { ok:true, metin:durum === 'kismen' ? 'Senin cümlenle kaydettim.' : 'Kaydettim; seni biraz daha iyi tanıyorum.',
      geriAl:async () => { await H.unut(r.kayit.id); const k = ortam.depo.oku(CIKARIM_KARAR) || {}; delete k[id]; ortam.depo.yaz(CIKARIM_KARAR, k); } };
  }
  /* Bir soruya cevap gibi mi? Selam, hal hatır, soru ve tek harf değil. */
  const SELAM = /^(merhaba|merhabalar|selam|selamlar|sa|slm|mrb|hey|hi|hello|naber|nbr|nasılsın|nasilsin|ne haber|günaydın|gunaydin|iyi (akşamlar|aksamlar|geceler|günler|gunler|sabahlar)|hayırlı (sabahlar|günler)|king)[\s!.,?]*$/;
  function cevapGibi(metin){
    const t = String(metin || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
    if(t.length < 2 || SELAM.test(t) || /\?\s*$/.test(t)) return false;
    return true;
  }
  const YORUMLA = /^(beni (yorumla|analiz et|tanı|oku)|benim hakkımda (bir )?(çıkarım|yorum) yap|hakkımda ne düşünüyorsun|beni nasıl görüyorsun|beni ne kadar tanıyorsun)/;

  function cevapBicimi(){ const v = ortam.depo.oku(CEVAP); return v === 'ses' || v === 'yazi' ? v : 'oto'; }
  function cevapSec(v){
    if(['oto', 'ses', 'yazi'].indexOf(v) < 0) return false;
    if(v === 'oto') ortam.depo.sil(CEVAP); else ortam.depo.yaz(CEVAP, v);
    if(v === 'yazi') sus();
    ciz(false);
    return true;
  }
  const sesleMi = () => { const b = cevapBicimi(); return b === 'ses' ? true : b === 'yazi' ? false : sesli; };

  const arsivAnahtar = () => 'king.arsiv.' + ((ayar && ayar.modul) || 'x');
  function arsivOku(){ const v = ortam.depo.oku(arsivAnahtar()); return Array.isArray(v) ? v.filter(k => k && k.id && Array.isArray(k.mesajlar)) : []; }
  function arsivYaz(l){ ortam.depo.yaz(arsivAnahtar(), l.slice(0, ARSIV_EN_COK)); }
  function sohbetMesajlari(){
    return akis.filter(m => !m.bekliyor && (m.metin || m.foto)).map(m => ({ kim:m.kim === 'sen' ? 'sen' : 'king',
      metin:m.foto ? '(fotoğraf)' : String(m.metin || ''), satirlar:Array.isArray(m.satirlar) ? m.satirlar.map(String) : null }));
  }
  function iki(n){ return (n < 10 ? '0' : '') + n; }
  function tarihYaz(iso){
    const d = new Date(iso);
    if(isNaN(d)) return '';
    const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return d.getDate() + ' ' + AY[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + iki(d.getHours()) + ':' + iki(d.getMinutes());
  }
  const YER = () => 'bu cihazda, ' + (MODUL_AD[ayar && ayar.modul] || 'bu modül') + ' içinde';

  /* Söz 26: açık sohbeti sessizce geçmişe yazar (aynı kimlik güncellenir). */
  function sessizArsivle(mesajlar, zaman){
    if(!ayar) return null;
    const l = mesajlar || sohbetMesajlari();
    if(!l.some(m => m.kim === 'sen')) return null;
    const d = zaman ? new Date(zaman) : ortam.simdi();
    const id = aktifKayit || ('k' + d.getTime());
    const eski = arsivOku().find(k => k.id === id);
    const kayit = { id, zaman:d.toISOString(), modul:ayar.modul, mesajlar:l, klasor:(eski && eski.klasor) || null,
      ad:(eski && eski.ad) || null, sabit:!!(eski && eski.sabit) };
    arsivYaz([kayit].concat(arsivOku().filter(k => k.id !== id)));
    return kayit;
  }
  function kayitBasligi(k){
    if(k && typeof k.ad === 'string' && k.ad.trim()) return k.ad.trim().slice(0, 44);
    const ilk = (k.mesajlar || []).find(m => m.kim === 'sen');
    const t = String(ilk ? ilk.metin : 'Sohbet').replace(/\s+/g, ' ').trim();
    return t.length > 44 ? t.slice(0, 43) + '…' : t;
  }
  function yeniSohbet(){
    sessizArsivle();
    akis = []; aktifKayit = null; silinen = null; menu = null; yanAcik = false;
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenFoto = null; bekleyenTanisma = null; sonGeriAl = null; cipler = null;
    ortam.depo.sil(depoAnahtar());
    ciz(true);
    return true;
  }
  function kayitAc(id){
    const k = kayitBul(id);
    if(!k) return false;
    if(aktifKayit !== id) sessizArsivle();
    akis = k.mesajlar.map(m => ({ kim:m.kim === 'sen' ? 'sen' : 'king', metin:String(m.metin || ''),
      satirlar:Array.isArray(m.satirlar) ? m.satirlar : null }));
    aktifKayit = id; menu = null; yanAcik = false; cipler = null;
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenTanisma = null;
    sakla();
    ciz(true);
    return true;
  }
  /* Önceki günün sohbeti geçmişe geçer (söz 26); bugünkü olduğu gibi kalır. */
  function dunuArsivle(){
    const v = ortam.depo.oku(depoAnahtar());
    if(!v || v.gun === bugunISO() || !Array.isArray(v.akis)) return;
    const l = v.akis.filter(m => m && m.metin).map(m => ({ kim:m.kim === 'sen' ? 'sen' : 'king', metin:String(m.metin),
      satirlar:Array.isArray(m.satirlar) ? m.satirlar.map(String) : null }));
    const once = aktifKayit; aktifKayit = null;
    sessizArsivle(l, String(v.gun) + 'T23:59:00');
    aktifKayit = once;
    ortam.depo.sil(depoAnahtar());
  }
  /* Araçlar kataloğu (söz 26–27): yazı alanındaki «+» menüsü. Her satır:
     data-king eylemi, ad, ipucu, ne zaman görüneceği. Yeni araç = yeni
     satır; eylemi tıklama yönlendiricisi zaten tanıyorsa başka şey gerekmez.
     Ses ve ekran araç değil KİPTİR (KIPLER). */
  const ARACLAR = [
    { is:'foto-sec', ad:'Fotoğraf ekle', ip:'Fotoğraf seç; Ctrl+V ile yapıştırmak da olur', kosul:() => true },
    { is:'ekran', ad:'Bu sayfayı göster', ip:'King bulunduğun LifeOS sayfasını okur', kosul:() => true },
    { is:'kisi', ad:'Beni nasıl tanıyorsun', ip:'Hafızadaki kayıtlar; her biri görünür ve silinir', kosul:() => !!(hafiza() && KISI()) },
    { is:'sohbet-kaydet', ad:'Sohbeti dosyaya kaydet', ip:'Bu sohbeti geçmişe ve indirilebilir dosyaya yazar', kosul:() => akis.some(m => m.kim === 'sen') },
    { is:'menu', ad:'Ayarlar', ip:'Cevap biçimi, kayıtlar, temizle', kosul:() => true },
  ];
  /* Kipler (söz 27). kosul: cihaz destekliyor mu. */
  const KIPLER = [
    { id:'yaz', ad:'Yaz', ip:'Yazarak konuş; cevap yazılı gelir', kosul:() => true },
    { id:'dinle', ad:'Dinle', ip:'Sen yaz, King her cevabı sesli okusun', kosul:() => !!ortam.sentez() },
    { id:'konus', ad:'Konuş', ip:'Sesli sohbet: King konuşunca yeniden dinler', kosul:() => !!ortam.tanima() },
    { id:'ekran', ad:'Ekran', ip:'Ekranını paylaş; sorduğunda King o anki ekranı görür', kosul:() => ortam.ekranDestek() },
  ];
  function kip(){ return paylasim ? 'ekran' : sesliSohbet ? 'konus' : cevapBicimi() === 'ses' ? 'dinle' : 'yaz'; }
  async function kipSec(id){
    if(!KIPLER.some(x => x.id === id && x.kosul())) return false;
    const once = kip();
    if(id === once) return true;
    if(once === 'ekran' && paylasim){ const p = paylasim; paylasim = null; try{ p.bitir(); }catch(e){ /* durmuş */ } }
    if(once === 'konus' && sesliSohbet){ sesliSohbet = false; if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } } }
    if(id === 'dinle'){ ortam.depo.yaz(CEVAP, 'ses'); ciz(false); return true; }
    if(cevapBicimi() === 'ses') ortam.depo.sil(CEVAP);
    if(id === 'yaz'){ sus(); ciz(false); return true; }
    if(id === 'konus') return sesliSohbetAc();
    if(id === 'ekran') return paylasimBaslat();
    return false;
  }
  function kipHtml(){
    const l = KIPLER.filter(x => { try{ return x.kosul(); }catch(e){ return false; } });
    if(l.length < 2) return '';
    const k = kip();
    return '<div class="king__kipler" role="radiogroup" aria-label="Konuşma biçimi">' + l.map(x => '<button type="button" role="radio" class="king__kip'
      + (x.id === k ? ' is-secili' : '') + '" aria-checked="' + (x.id === k ? 'true' : 'false') + '" data-king="kip:' + x.id + '" title="' + kac(x.ip) + '">'
      + KIP_SVG[x.id] + '<span>' + x.ad + '</span></button>').join('') + '</div>';
  }
  const KIP_SVG = {
    yaz:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    dinle:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.5"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.5"/></svg>',
    konus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>',
    ekran:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="11.5" rx="2"/><path d="M9 20h6M12 16.5V20"/></svg>',
  };
  /* Kip paneli: Dinle, Konuş ve Ekran için yazı alanının üstünde tek şerit. */
  function kipPanel(){
    const k = kip();
    if(k === 'ekran') return '<div class="king__paylasim king__kip-panel king__kip-panel--ekran" role="status">'
      + '<div class="king__ekran-onizle" data-king-onizle aria-label="Paylaşılan ekranın önizlemesi"></div>'
      + '<div class="king__kip-metin"><b><i class="king__canli" aria-hidden="true"></i>Ekranın paylaşılıyor</b>'
      + '<span>Görüntü yalnız sorduğunda yapay zekâya gider, saklanmaz.</span>'
      + '<div class="king__kip-eylem"><button type="button" class="king__cip king__cip--ana" data-king="ekran-sor">Ekranda ne görüyorsun?</button>'
      + '<button type="button" class="king__cip" data-king="paylasim-bitir">Durdur</button></div></div></div>';
    /* Söz 30: Konuş kutusuz; ince şerit. Ses seçimi ··· menüsünde. */
    if(k === 'konus') return '<div class="king__kip-panel king__kip-panel--konus" role="status">'
      + '<span class="king__ses-kure" aria-hidden="true">' + KURE + '</span>'
      + '<b class="king__ses-durum"><span class="d-dinliyor">Dinliyorum…</span><span class="d-konusuyor">King konuşuyor…</span><span class="d-sira">Sıra sende</span></b>'
      + '<button type="button" class="king__hap king__hap--simge" data-king="kip:yaz" aria-label="Sesli sohbeti bitir" title="Bitir (ya da «tamam» de)">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></div>';
    if(k === 'dinle') return '';
    return '';
  }
  /* Dinle: baslikta, kiplerin solunda kucuk ses dugmeleri (2026-10-19, «kutu yerine sag ustte»). */
  function dinleHap(){
    /* Kaldirildi (2026-10-19, depo sahibi: «bu kaldi»): susturmak icin kureye dokun,
       kapatmak icin «Yaz» kipi. */
    if(kip() !== 'dinle' || true) return '';
    {
      /* Kose hapi (2026-10-19, «alan kaplamasin»): ses secimi tek dugme (dokundukca
         sirayla degisir), Sustur ve Kapat yalniz simge. */
      return '<div class="king__dinle-hap" role="group" aria-label="Sesli okuma">'
        + '<button type="button" class="king__hap king__hap--simge" data-king="sus" aria-label="Sustur" title="Sustur">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg></button>'
        + '<button type="button" class="king__hap king__hap--simge" data-king="kip:yaz" aria-label="Kapat" title="Kapat">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></div>';
    }
    return '';
  }

  /* Klasörler (söz 27): bu cihazda, modül başına. */
  const klasorAnahtar = () => 'king.klasor.' + ((ayar && ayar.modul) || 'x');
  function klasorler(){ const v = ortam.depo.oku(klasorAnahtar()); return Array.isArray(v) ? v.filter(k => k && k.id && k.ad) : []; }
  function klasorEkle(ad){
    const a = String(ad || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if(!a) return null;
    const k = { id:'f' + ortam.simdi().getTime().toString(36) + klasorler().length, ad:a };
    ortam.depo.yaz(klasorAnahtar(), klasorler().concat([k]).slice(0, 20));
    return k;
  }
  function klasorSil(id){
    ortam.depo.yaz(klasorAnahtar(), klasorler().filter(k => k.id !== id));
    arsivYaz(arsivOku().map(k => k.klasor === id ? Object.assign({}, k, { klasor:null }) : k));
  }
  function kayitTasi(kayitId, klasorId){
    if(klasorId && !klasorler().some(k => k.id === klasorId)) return false;
    if(!kayitBul(kayitId)) return false;
    arsivYaz(arsivOku().map(k => k.id === kayitId ? Object.assign({}, k, { klasor:klasorId || null }) : k));
    return true;
  }
  function kayitAdlandir(id, ad){
    if(!kayitBul(id)) return false;
    const a = String(ad || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    arsivYaz(arsivOku().map(k => k.id === id ? Object.assign({}, k, { ad:a || null }) : k));
    return true;
  }
  function kayitSabitle(id){
    const k = kayitBul(id);
    if(!k) return false;
    arsivYaz(arsivOku().map(x => x.id === id ? Object.assign({}, x, { sabit:!x.sabit }) : x));
    return !k.sabit;
  }
  function gecmisSatir(k){
    const ac = k.id === aktifKayit;
    const kls = klasorler();
    if(adlandirilan === k.id) return '<li class="king__gecmis-satir"><form class="king__klasor-form" data-king-adlandir="' + kac(k.id) + '">'
      + '<input class="king__ara" type="text" maxlength="60" value="' + kac(kayitBasligi(k)) + '" aria-label="Sohbetin adı" data-king-ad/>'
      + '<button type="submit" class="king__cip king__cip--ana">Kaydet</button></form></li>';
    return '<li class="king__gecmis-satir" data-king-ara="' + kac(kayitBasligi(k).toLocaleLowerCase('tr')) + '">'
      + '<button type="button" class="king__gecmis-is' + (ac ? ' is-acik' : '') + '" data-king="kayit-ac:' + kac(k.id) + '"' + (ac ? ' aria-current="true"' : '') + '>'
      + '<span>' + kac(kayitBasligi(k)) + '</span><small>' + kac(tarihYaz(k.zaman)) + '</small></button>'
      + '<span class="king__gecmis-eylem">'
      + '<button type="button" class="king__gecmis-ufak' + (k.sabit ? ' is-sabit' : '') + '" data-king="sabitle:' + kac(k.id) + '" aria-pressed="' + (k.sabit ? 'true' : 'false')
      + '" aria-label="' + (k.sabit ? 'Sabitlemeyi kaldır' : 'Sabitle') + '" title="' + (k.sabit ? 'Sabitlemeyi kaldır' : 'Sabitle') + '">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6l-1 5 3 3v2H7v-2l3-3zM12 14v6"/></svg></button>'
      + '<button type="button" class="king__gecmis-ufak" data-king="adlandir:' + kac(k.id) + '" aria-label="Yeniden adlandır" title="Yeniden adlandır">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button>'
      + (kls.length ? '<button type="button" class="king__gecmis-ufak" data-king="tasi:' + kac(k.id) + '" aria-label="Klasöre taşı" title="Klasöre taşı">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg></button>' : '')
      + '<button type="button" class="king__gecmis-ufak' + (silOnay === k.id ? ' is-onay' : '') + '" data-king="gecmis-sil:' + kac(k.id) + '" aria-label="'
      + (silOnay === k.id ? 'Silinsin mi? Bir daha dokun' : 'Sohbeti sil') + '" title="' + (silOnay === k.id ? 'Silinsin mi?' : 'Sil') + '">'
      + (silOnay === k.id ? 'Sil?' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>') + '</button></span>'
      + (tasinan === k.id ? '<div class="king__tasi" role="group" aria-label="Taşınacak klasör">'
        + kls.map(f => '<button type="button" class="king__cip' + (k.klasor === f.id ? ' king__cip--ana' : '') + '" data-king="tasi-yap:' + kac(k.id) + ':' + kac(f.id) + '">' + kac(f.ad) + '</button>').join('')
        + (k.klasor ? '<button type="button" class="king__cip" data-king="tasi-yap:' + kac(k.id) + ':">Klasörden çıkar</button>' : '') + '</div>' : '')
      + '</li>';
  }
  function yanHtml(){
    const gecmis = arsivOku(), kls = klasorler();
    const var_ = id => kls.some(f => f.id === id);
    const sabit = gecmis.filter(k => k.sabit);
    const serbest = gecmis.filter(k => !k.sabit && (!k.klasor || !var_(k.klasor)));
    return '<button type="button" class="king__yeni" data-king="yeni-sohbet">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Yeni sohbet</button>'
      + (gecmis.length > 3 ? '<input class="king__ara" type="search" data-king-ara-girdi placeholder="Sohbetlerde ara" aria-label="Sohbetlerde ara" autocomplete="off"/>' : '')
      + (sabit.length ? '<p class="king__yan-ad">Sabitlenenler</p><ul class="king__gecmis">' + sabit.map(gecmisSatir).join('') + '</ul>' : '')
      + '<div class="king__yan-bas"><p class="king__yan-ad">Klasörler</p>'
      + '<button type="button" class="king__gecmis-ufak" data-king="klasor-yeni" aria-label="Yeni klasör" title="Yeni klasör">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v10M7 12h10"/></svg></button></div>'
      + (klasorYeni ? '<form class="king__klasor-form" data-king-klasor><input class="king__ara" type="text" maxlength="40" placeholder="Klasör adı" aria-label="Klasör adı" data-king-klasor-ad/>'
        + '<button type="submit" class="king__cip king__cip--ana">Ekle</button></form>' : '')
      + (kls.length ? kls.map(f => {
          const ic = gecmis.filter(k => k.klasor === f.id && !k.sabit);
          return '<details class="king__klasor" open><summary><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>'
            + '<span>' + kac(f.ad) + '</span><small>' + ic.length + '</small>'
            + '<button type="button" class="king__gecmis-ufak" data-king="klasor-sil:' + kac(f.id) + '" aria-label="Klasörü kaldır (sohbetler silinmez)" title="Klasörü kaldır; sohbetler silinmez">'
            + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></summary>'
            + (ic.length ? '<ul class="king__gecmis">' + ic.map(gecmisSatir).join('') + '</ul>' : '<p class="king__yan-bos">Boş. Bir sohbetin klasör düğmesiyle buraya taşı.</p>')
            + '</details>';
        }).join('') : (klasorYeni ? '' : '<p class="king__yan-bos">Sohbetlerini konulara ayırmak için klasör ekle.</p>'))
      + '<p class="king__yan-ad">Sohbetler</p>'
      + (serbest.length ? '<ul class="king__gecmis">' + serbest.map(gecmisSatir).join('') + '</ul>'
        : '<p class="king__yan-bos">' + (gecmis.length ? 'Hepsi klasörlerde.' : 'Henüz geçmiş sohbet yok. «Yeni sohbet» dediğinde ya da gün değiştiğinde açık sohbet buraya geçer.') + '</p>');
  }
  /* Söz 31: yazı alanında düşünme derinliği (yalnız Merkez bağlıyken). */
  function derinHtml(){
    if(!baglanti()) return '';
    const d = derinlik();
    return '<div class="king__derin-yer"><button type="button" class="king__derin' + (derinAcik ? ' is-acik' : '') + (d !== 'oto' ? ' is-secili' : '')
      + '" data-king="derin" aria-haspopup="menu" aria-expanded="' + (derinAcik ? 'true' : 'false')
      + '" aria-label="Düşünme: ' + DERIN_AD[d] + '" title="Düşünme: ' + kac(DERIN_IP[d]) + '">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4L7 17M17 7l1.4-1.4"/><circle cx="12" cy="12" r="3.5"/></svg>'
      + '<span>' + DERIN_AD[d] + '</span></button>'
      + (derinAcik ? '<div class="king__arac-menu king__derin-menu" role="menu" aria-label="Düşünme derinliği">'
        + DERIN_TERCIH.map(v => '<button type="button" role="menuitemradio" aria-checked="' + (v === d ? 'true' : 'false')
          + '" class="king__arac' + (v === d ? ' is-secili' : '') + '" data-king="derinlik:' + v + '"><b>' + DERIN_AD[v] + '</b><small>'
          + kac(DERIN_IP[v]) + '</small></button>').join('') + '</div>' : '')
      + '</div>';
  }
  function aracMenu(){
    if(!aracAcik) return '';
    return '<div class="king__arac-menu" role="menu" aria-label="Araçlar">'
      + ARACLAR.filter(a => { try{ return a.kosul(); }catch(e){ return false; } }).map(a => '<button type="button" role="menuitem" class="king__arac" data-king="' + a.is
        + '"><b>' + kac(a.ad) + '</b><small>' + kac(a.ip) + '</small></button>').join('') + '</div>';
  }

  function sohbetiKaydet(){
    if(!ayar) return null;
    const mesajlar = sohbetMesajlari();
    if(!mesajlar.some(m => m.kim === 'sen')){ soyle('Kaydedilecek bir sohbet yok; önce bir şey yaz ya da söyle.'); return null; }
    const d = ortam.simdi();
    const kayit = { id:aktifKayit || ('k' + d.getTime()), zaman:d.toISOString(), modul:ayar.modul, mesajlar };
    aktifKayit = kayit.id;
    arsivYaz([kayit].concat(arsivOku().filter(k => k.id !== kayit.id)));
    cipler = [{ is:'kayitlar', ad:'Kayıtları gör' }, { is:'indir:' + kayit.id, ad:'Dosya olarak indir' }];
    soyle('Sohbeti kaydettim: ' + YER() + '. Hiçbir sunucuya gitmedi.');
    return kayit;
  }
  function kayitMetni(k){
    const satir = ['LifeOS · King sohbeti', (MODUL_AD[k.modul] || '') + ' · ' + tarihYaz(k.zaman), ''];
    k.mesajlar.forEach(m => {
      satir.push((m.kim === 'sen' ? 'Sen: ' : 'King: ') + m.metin);
      (m.satirlar || []).forEach(x => satir.push('  • ' + x));
    });
    return satir.join('\n') + '\n';
  }
  function kayitDosyaAdi(k){
    const d = new Date(k.zaman);
    return 'king-' + (k.modul || 'lifeos') + '-' + d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate())
      + '-' + iki(d.getHours()) + iki(d.getMinutes()) + '.txt';
  }
  function kayitBul(id){ return arsivOku().find(k => k.id === id) || null; }
  function kayitIndir(id){
    const k = kayitBul(id);
    if(!k) return false;
    const ad = kayitDosyaAdi(k);
    const ok = ortam.indir(ad, kayitMetni(k));
    cipler = null;
    soyle(ok ? 'Dosyayı indirdim: ' + ad + ' · tarayıcının İndirilenler klasöründe.' : 'Bu cihazda dosya indirilemedi; «Kopyala» ile metni alabilirsin.');
    return ok;
  }
  async function kayitKopyala(id){
    const k = kayitBul(id);
    if(!k) return false;
    const ok = await ortam.kopyala(kayitMetni(k));
    soyle(ok ? 'Sohbeti panoya kopyaladım; istediğin yere yapıştırabilirsin.' : 'Panoya kopyalanamadı.');
    return ok;
  }
  function kayitSil(id){
    if(silOnay !== id){ silOnay = id; ciz(false); return false; }
    silOnay = null;
    arsivYaz(arsivOku().filter(k => k.id !== id));
    if(aktifKayit === id) aktifKayit = null;
    if(menu && menu.id === id) menu = 'kayitlar';
    ciz(false);
    return true;
  }
  function sohbetiTemizle(){
    const once = akis.filter(m => !m.bekliyor);
    if(!once.length){ menu = null; ciz(false); return false; }
    silinen = once;
    akis = []; bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenFoto = null; sonGeriAl = null;
    ortam.depo.sil(depoAnahtar());
    cipler = [{ is:'geri-getir', ad:'Geri getir' }];
    soyle('Sohbeti temizledim; bu cihazdan da silindi.');
    return true;
  }
  function sohbetiGeriGetir(){
    if(!silinen) return false;
    akis = silinen.concat(akis.filter(m => m.metin !== 'Sohbeti temizledim; bu cihazdan da silindi.'));
    silinen = null; cipler = null;
    soyle('Sohbet geri geldi.');
    return true;
  }
  function menuAc(v){
    menu = menu && v === 'menu' && menu === 'menu' ? null : v;
    silOnay = null;
    if(menu === 'menu') mikTazele();
    ciz(false);
  }

  function menuHtml(){
    if(menu === 'menu'){
      const b = cevapBicimi(), n = arsivOku().length, mk = mikSecili();
      const mikler = mikListe.filter(d => d && d.id && d.id !== 'default');
      const sec = (v, ad, ip) => '<button type="button" class="king__secim' + (b === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
        + (b === v ? 'true' : 'false') + '" data-king="cevap:' + v + '" title="' + ip + '">' + ad + '</button>';
      return '<div class="king__menu" role="group" aria-label="Sohbet ayarları">'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Cevaplar</span><div class="king__secici" role="radiogroup" aria-label="Cevaplar">'
        + sec('oto', 'Otomatik', 'Konuşarak sorduğuna sesli, yazarak sorduğuna yazılı cevap')
        + sec('ses', 'Sesli', 'Yazsan da cevabı sesli okur; yazı da görünür')
        + sec('yazi', 'Yazılı', 'Konuşsan da cevap yalnız yazılı gelir') + '</div></div>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Düşünme</span><div class="king__secici" role="radiogroup" aria-label="Düşünme derinliği">'
        + DERIN_TERCIH.map(v => '<button type="button" class="king__secim' + (derinlik() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (derinlik() === v ? 'true' : 'false') + '" data-king="derinlik:' + v + '" title="' + kac(DERIN_IP[v]) + '">' + DERIN_AD[v] + '</button>').join('') + '</div></div>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Ses</span><div class="king__secici" role="radiogroup" aria-label="Ses">'
        + SES_TERCIH.map(v => '<button type="button" class="king__secim' + (sesTercihi() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (sesTercihi() === v ? 'true' : 'false') + '" data-king="ses:' + v + '" title="' + kac(SES_IP[v]) + '">' + SES_AD[v] + '</button>').join('') + '</div></div>'
        + (sonMotor ? '<p class="king__menu-not" data-king-son-ses>Son okuyan: ' + kac(SES_AD[sonMotor] || sonMotor) + '.' + (sonNot ? ' ' + kac(sonNot) : '') + '</p>' : '')
        + '<div class="king__menu-satir"><span class="king__menu-ad">Algılama</span><div class="king__secici" role="radiogroup" aria-label="Ses algılama">'
        + ALGILA_TERCIH.map(v => '<button type="button" class="king__secim' + (algila() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (algila() === v ? 'true' : 'false') + '" data-king="algila:' + v + '" title="' + kac(ALGILA_IP[v]) + '">' + ALGILA_AD[v] + '</button>').join('') + '</div></div>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Mikrofon</span><div class="king__kisi-ekle">'
        + '<select data-king-mik aria-label="Mikrofon">'
        + '<option value="">Varsayılan mikrofon</option>'
        + mikler.map(d => '<option value="' + kac(d.id) + '"' + (mk === d.id ? ' selected' : '') + '>' + kac(d.ad) + '</option>').join('')
        + (mk && !mikler.some(d => d.id === mk) ? '<option value="' + kac(mk) + '" selected>Seçili mikrofon</option>' : '')
        + '</select>'
        + '<button type="button" class="king__geri" data-king="mik-dene">' + (mikDeniyor ? 'Bitir' : 'Mikrofonu dene') + '</button></div></div>'
        + (mikNot ? '<p class="king__menu-not" data-king-mik-not role="status">' + kac(mikNot) + '</p>' : '')
        + '<div class="king__menu-satir"><span class="king__menu-ad">Hız</span><div class="king__secici" role="radiogroup" aria-label="Okuma hızı">'
        + HIZLAR.map(v => '<button type="button" class="king__secim' + (hiz() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (hiz() === v ? 'true' : 'false') + '" data-king="hiz:' + v + '">' + String(v).replace('.', ',') + '×</button>').join('') + '</div></div>'
        + (hafiza() && KISI() ? '<button type="button" class="king__menu-is" data-king="kisi">Beni nasıl tanıyorsun<span class="king__menu-say">'
          + kisiKayitlari().length + '</span></button>' : '')
        + (sormaListesi().length ? '<div class="king__menu-satir"><span class="king__menu-ad">Sormadan ekler: ' + kac(sormaListesi().join(', '))
          + '</span><button type="button" class="king__geri" data-king="sorma-sifirla">Hepsini sor</button></div>' : '')
        + '<button type="button" class="king__menu-is" data-king="sohbet-kaydet">Sohbeti kaydet</button>'
        + '<button type="button" class="king__menu-is" data-king="kayitlar">Kayıtlı sohbetler<span class="king__menu-say">' + n + '</span></button>'
        + '<button type="button" class="king__menu-is king__menu-is--tehlike" data-king="temizle">Sohbeti temizle</button>'
        + '<p class="king__menu-not">Kayıtlar ' + kac(YER()) + ' durur; hiçbir sunucuya gitmez.</p></div>';
    }
    if(menu === 'kisi'){
      const K = KISI();
      if(!K) return '';
      const g = K.grupla(kisiKayitlari());
      const ETK = { soz:'senin sözün', sohbet:'sohbetten', cikarim:'tahmin' };
      const dolu = K.ALANLAR.filter(a => g[a.id].length).length;
      const satir = k => '<li><span><b>' + kac(k.metin) + '</b><small>' + kac(ETK[k.katman] || 'kayıt')
        + (k.kendi ? '' : ' · ' + kac(MODUL_AD[k.modul] || k.modul) + '’de öğrenildi') + '</small></span>'
        + (k.kendi ? '<button type="button" class="king__cip king__cip--tehlike" data-king="kisi-sil:' + kac(k.id) + '">Sil</button>' : '') + '</li>';
      /* Faz 5: alan başına hangi modül ajanının göreceği (King hepsini görür). */
      const izin = a => '<span class="king__izin" role="group" aria-label="' + kac(a.ad) + ' için ajan izinleri">'
        + ['ays', 'spi', 'esp'].map(m => { const ac = K.izinli(a.id, m);
          return '<button type="button" class="king__izin-dugme' + (ac ? ' is-acik' : '') + '" aria-pressed="' + (ac ? 'true' : 'false')
            + '" data-king="kisi-izin:' + a.id + ':' + m + '" title="' + MODUL_AD[m] + ' ajanları ' + (ac ? 'görüyor' : 'görmüyor') + '">' + MODUL_AD[m] + '</button>'; }).join('')
        + '</span>';
      const bolum = (ad, l, a) => l.length ? '<section class="king__kisi-alan"><h3>' + kac(ad) + (a ? izin(a) : '') + '</h3><ul class="king__liste-kisi">' + l.map(satir).join('') + '</ul></section>' : '';
      return '<div class="king__menu" role="group" aria-label="Beni nasıl tanıyorsun">'
        + '<div class="king__menu-ust"><button type="button" class="king__geri" data-king="menu">‹ Geri</button><b>Beni nasıl tanıyorsun</b></div>'
        + '<p class="king__menu-not">' + K.ALANLAR.length + ' alandan ' + dolu + '’inde bilgi var. Sohbetten öğrendiklerim «sohbetten», '
        + 'senin yazdıkların «senin sözün» diye durur. Hepsi bu bilgisayarda; sildiğin unutulur. '
        + 'King hepsini görür; alanın yanındaki AYS · SPİ · ESP o modülün ajanlarının görüp görmediğidir.</p>'
        + '<div class="king__kisi-ekle"><select data-kisi-alan aria-label="Alan">'
        + K.ALANLAR.map(a => '<option value="' + a.id + '"' + (a.id === kisiYeni.alan ? ' selected' : '') + '>' + kac(a.ad) + '</option>').join('')
        + '</select><input type="text" data-kisi-metin data-ayar-disi aria-label="Benim hakkımda" placeholder="Örneğin: Sabahları daha verimliyim" autocomplete="off"/>'
        + '<button type="button" class="king__cip king__cip--ana" data-king="kisi-ekle">Ekle</button></div>'
        + (dolu || g.genel.length ? K.ALANLAR.map(a => bolum(a.ad, g[a.id], a)).join('') + bolum('Genel', g.genel)
          : '<p class="king__menu-bos">Henüz seni tanımıyorum. «Balığı sevmem», «hobim satranç» gibi söylediklerini kendiliğinden not ederim.</p>')
        + '</div>';
    }
    if(menu === 'kayitlar'){
      const l = arsivOku();
      return '<div class="king__menu" role="group" aria-label="Kayıtlı sohbetler">'
        + '<div class="king__menu-ust"><button type="button" class="king__geri" data-king="menu">‹ Geri</button><b>Kayıtlı sohbetler</b></div>'
        + '<p class="king__menu-not">' + kac(YER().charAt(0).toUpperCase() + YER().slice(1)) + '. İndirdiğin dosya tarayıcının İndirilenler klasörüne iner.</p>'
        + (l.length ? '<ul class="king__kayitlar">' + l.map(k => {
          const ilk = (k.mesajlar.find(m => m.kim === 'sen') || k.mesajlar[0] || {}).metin || '';
          return '<li><button type="button" class="king__kayit-ac" data-king="kayit:' + k.id + '"><b>' + kac(tarihYaz(k.zaman)) + '</b>'
            + '<span>' + kac(ilk.slice(0, 70)) + '</span><small>' + k.mesajlar.length + ' mesaj</small></button></li>';
        }).join('') + '</ul>' : '<p class="king__menu-bos">Henüz kayıtlı sohbet yok. Menüden «Sohbeti kaydet» de.</p>')
        + '</div>';
    }
    if(menu && menu.id){
      const k = kayitBul(menu.id);
      if(!k){ menu = 'kayitlar'; return menuHtml(); }
      return '<div class="king__menu" role="group" aria-label="Kayıtlı sohbet">'
        + '<div class="king__menu-ust"><button type="button" class="king__geri" data-king="kayitlar">‹ Kayıtlar</button><b>' + kac(tarihYaz(k.zaman)) + '</b></div>'
        + '<ol class="king__kayit">' + k.mesajlar.map(m => '<li class="' + (m.kim === 'sen' ? 'is-sen' : 'is-king') + '"><b>' + (m.kim === 'sen' ? 'Sen' : 'King')
          + '</b><p>' + kac(m.metin) + '</p>' + (m.satirlar && m.satirlar.length ? '<ul>' + m.satirlar.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : '') + '</li>').join('') + '</ol>'
        + '<div class="king__cipler"><button type="button" class="king__cip king__cip--ana" data-king="indir:' + k.id + '">Dosya olarak indir</button>'
        + '<button type="button" class="king__cip" data-king="kopyala:' + k.id + '">Kopyala</button>'
        + '<button type="button" class="king__cip king__cip--tehlike" data-king="sil:' + k.id + '">' + (silOnay === k.id ? 'Emin misin? Sil' : 'Sil') + '</button></div>'
        + '</div>';
    }
    return '';
  }

  function soyle(metin, satirlar, onizleme, son){
    akis.forEach(m => { m.yeni = false; });
    akis.push({ kim:'king', metin, satirlar, onizleme, son, yeni:true });
    /* Söz 8: ekranda son altı satır; söz 19: günün tamamı saklanır. */
    akis = akis.slice(-GUNLUK_EN_COK);
    menu = null;
    sakla();
    ciz();
    const sesle = sesleMi();
    if(sesliSohbet && (!ortam.sentez() || !sesle)) ortam.zamanla(sohbetDevam, 600);
    if(sesle) seslendir([metin].concat(satirlar || [], onizleme ? [onizleme.metin] : [], son ? [son] : []).join('. ').replace(/\.\.+/g, '.').replace(/([!?])\./g, '$1'));
  }

  async function isle(metin){
    /* Söz 8: bekleyen soruya yazıyla cevap («evet», «hayır»). */
    const t0 = kucuk(metin);
    /* Söz 20: büyük eylem yalnız açık onayla. */
    if(bekleyenYetki && /^onayl[ıi]yorum[.!]?$/.test(t0)){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      await yetkiUygula();
      return { tur:'yetki' };
    }
    if(bekleyenYetki && (EVET.test(t0) || HAYIR.test(t0))){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      if(HAYIR.test(t0)){ vazgec(); return { tur:'hayir' }; }
      if(bekleyenYetki.seviye === 'buyuk'){
        soyle('Bu büyük bir değişiklik; «evet» yetmez. «Onaylıyorum» yaz ya da düğmeye dokun.');
        return { tur:'yetki-bekliyor' };
      }
      await yetkiUygula();
      return { tur:'yetki' };
    }
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
    /* Söz 25: üslup sayacı (yalnız sayı) ve envanter. */
    if(ENV() && hafiza()) ortam.depo.yaz(USLUP, ENV().uslupGuncelle(ortam.depo.oku(USLUP), metin));
    if(envanter){
      const c = envanterCevap(metin);
      akis.push({ kim:'sen', metin:String(metin).trim() });
      if(c != null){ await envanterIlerle(c); return { tur:'envanter' }; }
      if(/^(bırak|dur|vazgeç|sonra)/.test(t0)){ envanter = null; cipler = null; soyle('Tamam, envanteri bıraktım; istediğin zaman «kişilik testi» de.'); return { tur:'envanter-dur' }; }
      soyle('1 ile 5 arasında bir sayı seç ya da «Bırak» de.'); return { tur:'envanter' };
    }
    if(ENV_BASLA.test(t0) && hafiza() && ENV()){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      bekleyenTanisma = null; cipler = null;
      envanterBasla();
      ciz(false);
      return { tur:'envanter' };
    }
    /* Söz 24: «… artık sorma / sor». */
    const SK = sormaKomutu(metin);
    if(SK && !veriGibi(metin)){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      bekleyen = null; cipler = null;
      soyle(sormaUygula(SK));
      return { tur:'sorma', sorma:SK.sorma };
    }
    /* Söz 22: hafıza komutları. */
    const HK = L.Hafiza && hafiza() ? L.Hafiza.komut(metin) : null;
    if(HK){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      bekleyenTanisma = null; cipler = null;
      if(HK.tur === 'liste'){ disKisiTazele().then(() => { if(acik && menu === 'kisi') ciz(false); }); menu = 'kisi'; ciz(false); return { tur:'kisi' }; }
      const r = await hafiza().komutIsle(metin);
      soyle(r ? r.text : 'Anlayamadım.');
      return { tur:'hafiza' };
    }
    if(YORUMLA.test(t0) && hafiza() && L.CIKARIM){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      bekleyenTanisma = null; cipler = null;
      const n = cikarimAdaylari().length;
      if(n){ soyle('Çıkarımlarımı sohbette sormuyorum; Onaylar’da duruyorlar. Şu an ' + n + ' tanesi kararını bekliyor.'); return { tur:'cikarim-onaylar', n }; }
      soyle('Şimdilik yeni bir çıkarımım yok; kayıtların arttıkça Onaylar’a bırakacağım. «Beni nasıl tanıyorsun»da bildiklerimi görebilirsin.');
      return { tur:'cikarim-yok' };
    }
    /* Söz 22: tanışma sorusunun cevabı (komut ya da veri değilse). */
    if(bekleyenTanisma){
      const y0 = yorumla(metin);
      /* Cevap içinde sayfa sözü geçebilir («kitap okumak»): yalnız veri
         cümlesi ve açık «aç» komutu cevap sayılmaz. */
      /* Selam, soru ya da tek kelimelik laf cevap DEĞİLDİR (2026-10-18:
         «MERHABA» «senin cümlenle not ettim» diye hafızaya yazılıyordu).
         Soru sessizce bırakılır, mesaj sohbet olarak akar. */
      if(cevapGibi(metin) && !(y0.tur === 'veri' || (y0.tur === 'git' && y0.kaynak === 'komut'))){
        akis.push({ kim:'sen', metin:String(metin).trim() });
        await tanismaCevapla(metin);
        return { tur:'tanisma' };
      }
      cipler = null;
      bekleyenTanisma = null;
    }
    /* Söz 20: sistem içindeki değişiklik kataloğa (yetki.js). */
    const Y = yetkiKatalog();
    const yn = Y && !paylasim ? Y.anla(metin) : null;
    if(yn){
      akis.push({ kim:'sen', metin:String(metin).trim() });
      bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenYetki = null; cipler = null;
      if(yn.tur === 'hesap'){ soyle(yn.metin); return { tur:'yetki-hesap' }; }
      if(yn.tur === 'olumsuz'){ soyle('Olumsuz bir istek; hiçbir şeyi değiştirmedim. Ne istediğini olumlu söylersen yaparım.'); return { tur:'yetki-olumsuz' }; }
      if(yn.tur === 'baska'){ soyle(yn.metin); return { tur:'yetki-baska', modul:yn.modul }; }
      if(yn.tur === 'liste'){
        cipler = yn.sayi ? [{ is:'yetki-hepsi', ad:'Hepsini onayla' }] : null;
        soyle(yn.metin, yn.satirlar && yn.satirlar.length ? yn.satirlar : null);
        return { tur:'yetki-liste' };
      }
      if(yn.seviye === 'kucuk'){ await yetkiUygula(yn); return { tur:'yetki', seviye:'kucuk' }; }
      bekleyenYetki = yn;
      cipler = [{ is:'yetki-onay', ad:yn.seviye === 'buyuk' ? 'Dönüş noktası al ve uygula' : 'Onayla' }, { is:'vazgec', ad:'Vazgeç' }];
      soyle(yn.onizle.metin, yn.onizle.satirlar || null, null,
        yn.seviye === 'buyuk' ? 'Büyük değişiklik: «Onaylıyorum» yaz ya da düğmeye dokun.' : 'Onaylıyor musun?');
      return { tur:'yetki-bekliyor', seviye:yn.seviye };
    }
    /* Söz 22: açık beyan kendiliğinden yazılır. */
    const bey = KISI() && hafiza() ? KISI().beyan(metin) : null;
    let ogrenilen = null;
    if(bey){
      ogrenilen = await beyanYaz(bey);
      const y1 = yorumla(metin);
      if(ogrenilen && y1.tur !== 'veri'){
        akis.push({ kim:'sen', metin:String(metin).trim() });
        bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
        const H = hafiza(), id = ogrenilen.id;
        sonGeriAl = async () => { await H.unut(id); };
        cipler = [{ is:'geri-al', ad:'Geri al' }];
        soyle('Not ettim: «' + ogrenilen.metin + '». Seni daha iyi tanıyorum.', null, null, KISI().BY_ID[bey.alan] ? KISI().BY_ID[bey.alan].ad : null);
        return { tur:'beyan', alan:bey.alan };
      }
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
    return yerel(y, neden, metin);
  }

  /* Yerel King (HKM yoksa ya da cevap veremediyse; sayfa ve kayıt hep burada). */
  function yerel(y, neden, metin){
    if(y.tur === 'notlar'){
      kapat();
      /* Defter (NOT-PLANI) kuruluysa o; değilse eski Notlarım paneli. */
      if(L.DEFTER && L.DEFTER.kuruluMu && L.DEFTER.kuruluMu()) L.DEFTER.ac();
      else if(L.NOTUM && L.NOTUM.panelAc) L.NOTUM.panelAc();
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
      /* Söz 24: bu tür için «sorma» dendiyse doğrudan kaydet («Geri al» kalır). */
      if(!y.gelecek && sormaMi(y.onizleme.tur)) return kaydet(s.selam).then(() => y);
      cipler = [{ ad:'Evet, ekle', is:'kaydet' }, { ad:'Hayır', is:'vazgec' }];
      soyle(s.selam, null,
        { metin:y.onizleme.metin, liste:(y.onizleme.parcalar || []).length > 1 ? y.onizleme.parcalar.map(x => x.metin) : null,
          ipucu:y.gelecek ? 'Henüz yapmadıysan, yaptıktan sonra da söyleyebilirsin.' : (y.onizleme.ipucu || '') },
        s.soru);
    }else if(SELAM.test(String(metin || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim())){
      /* Selam selamla karşılanır (2026-10-18: «MERHABA»ya «anlayamadım» denmesin). */
      soyle(selam());
    }else{
      const on = neden === 'yok' ? 'King’in modeli şu an kapalı. '
        : neden === 'baglanti' ? 'Merkeze (HKM) şu an ulaşılamadı. ' : '';
      soyle(on + 'Bunu anlayamadım. Şunlardan birini seçebilir ya da «hareket sayfasına git», «uyku 7», '
        + '«bugünün özeti» gibi yazabilirsin.');
    }
    return y;
  }

  async function kaydet(onEk){
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
      /* Kayıt yazıldı: zeminde tek seferlik ışık (zemin.js nabiz). */
      if(L.ZEMIN && typeof L.ZEMIN.nabiz === 'function'){ try{ L.ZEMIN.nabiz(); }catch(e){ /* süs */ } }
      soyle((onEk ? String(onEk).trim() + ' ' : '') + m + ' Başka bir şey var mı?');
    }catch(e){
      soyle('Kaydedilemedi: ' + ((e && e.message) || 'bilinmeyen hata'));
    }
  }

  function vazgec(){
    const git0 = !!bekleyenGit;
    const foto0 = !!bekleyenFoto;
    const yetki0 = !!bekleyenYetki;
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenFoto = null; bekleyenYetki = null; cipler = null;
    soyle(yetki0 ? 'Tamam, hiçbir şeyi değiştirmedim.' : git0 || foto0 ? 'Tamam, buradayım.' : 'Tamam, eklemedim.');
  }

  /* ---------- söz 20: yetki ---------- */
  function yetkiKatalog(){
    const Y = L.YETKI;
    return Y && typeof Y.kuruluMu === 'function' && Y.kuruluMu() ? Y : null;
  }
  async function yetkiUygula(n){
    n = n || bekleyenYetki;
    bekleyenYetki = null; cipler = null;
    const Y = yetkiKatalog();
    if(!Y || !n) return null;
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek);
    ciz(false);
    const r = await Y.uygula(n);
    akis = akis.filter(m => m !== bek);
    if(r.ok && typeof r.geriAl === 'function'){ sonGeriAl = r.geriAl; cipler = [{ is:'geri-al', ad:'Geri al' }]; }
    soyle(r.metin, r.satirlar && r.satirlar.length ? r.satirlar : null);
    if(r.ok && r.yenile){
      /* Sayfa yeniden yüklenince King aynı sayfada küçük kutu olarak açılır. */
      ortam.depo.yaz(TASIMA, Object.assign({}, ortam.depo.oku(TASIMA) || {}, { acik:true, mini:true, kaynak:ayar.modul, yenile:true, zaman:Date.now() }));
      ortam.zamanla(() => ortam.yenile(), 1400);
    }
    return r;
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
    const satirlar = akis.slice(-GUNLUK_EN_COK);
    /* Sade başlık (söz 27): kenar düğmesi, King, modül, durum; sağda yalnız
       daha fazla, küçült, kapat. Ses ve ekran kip seçicide. */
    const bas = '<div class="king__bas">'
      + '<button type="button" class="king__kapat king__yan-dugme" data-king="yan" aria-expanded="'
      + ((ortam.genis() ? !yanDar() : yanAcik) ? 'true' : 'false')
      + '" aria-label="Sohbet geçmişi" title="' + (ortam.genis() && !yanDar() ? 'Kenar çubuğunu kapat' : 'Sohbet geçmişi') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/></svg></button>'
      + KURE + '<b>King</b>'
      + '<span class="king__yer">' + NOKTA(ayar && ayar.modul) + kac(MODUL_AD[ayar && ayar.modul] || '') + '</span>'
      + '<span class="king__durum" title="' + (baglanti() ? 'Sorular Merkez’deki King’e (yapay zekâ) gider'
        : gorselZincir().length ? 'Merkez bağlı değil; sorulara yerel kurallarla, ekran ve fotoğrafa görüntü okuyan modelle cevap verir'
        : 'Merkez bağlı değil: King yerel kurallarla cevaplar') + '">'
      + (baglanti() ? 'yapay zekâ' : gorselZincir().length ? 'görüntü açık' : 'yerel') + '</span>'
      + dinleHap() + kipHtml()
      + '<button type="button" class="king__kapat king__menu-dugme' + (menu ? ' is-acik' : '') + '" data-king="menu" aria-expanded="' + (menu ? 'true' : 'false')
      + '" aria-label="Ayarlar" title="Ayarlar: cevap biçimi, sohbeti kaydet, kayıtlar, temizle">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/></svg></button>'
      + '<button type="button" class="king__kapat king__kucult" data-king="kucult" aria-label="Küçült" title="Küçült: sayfayı kullanırken açık kalır">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5l-6 6M14 11h-3V8M5 19l6-6M10 13h3v3"/></svg></button>'
      + '<button type="button" class="king__kapat" data-king="kapat" aria-label="Kapat" title="Kapat (Esc)">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>';
    const panel = menuHtml();
    const ilkSira = akis.length - satirlar.length;
    const yan = '<aside class="king__yan" aria-label="Sohbet geçmişi">' + yanHtml() + '</aside><div class="king__ana">';
    /* Boş sohbet (söz 27): ortada küre, selam ve hazır cevaplar. */
    const hazirlar = HAZIR.map((h, i) => ({ h, i })).sort((a, b) => (a.h.ozet - b.h.ozet)
          || ((b.h.modul === (ayar && ayar.modul)) - (a.h.modul === (ayar && ayar.modul))) || a.i - b.i)
          .map(({ h, i }) => '<button type="button" class="king__cip king__hazir" data-king-hazir="' + i + '">'
          + NOKTA(h.ozet ? (ayar && ayar.modul) : h.modul) + kac(h.ad) + '</button>').join('');
    const bos = '<div class="king__bos"><span class="king__bos-kure" aria-hidden="true">' + KURE + '</span>'
      + '<h2 class="king__bos-selam">' + kac(selam()) + '</h2>'
      + '<p class="king__bos-alt">Yaz, konuş ya da ekranını göster. Kaydetmeden önce her zaman sorarım.</p>'
      + '<div class="king__hazirlar" role="group" aria-label="Hazır cevaplar">' + hazirlar + '</div></div>';
    const balonlar = satirlar.map((m, i) => m.kim === 'sen'
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
        + '</div>' + (akis.length ? '<button type="button" class="king__kopyala" data-king="kopyala-mesaj:' + (ilkSira + i)
          + '" aria-label="Cevabı kopyala" title="Kopyala"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/>'
          + '<path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg></button>' : '') + '</div>').join('');
    const cip = cipler
      ? cipler.map(c => '<button type="button" class="king__cip' + (c.is === 'kaydet' || c.is === 'ilet' || /^foto:0$/.test(c.is) || (c.is === 'foto-yorum' && !/foto:0/.test(JSON.stringify(cipler))) ? ' king__cip--ana' : '')
          + '" data-king="' + c.is + '">' + kac(c.ad) + '</button>').join('')
      /* Hazır cevaplar yalnız boş sohbette, ortada (bos). */
      : '';
    const mik = ortam.tanima()
      ? '<button type="button" class="king__mik' + (dinleyen ? ' is-acik' : '') + '" data-king="dinle" aria-pressed="'
        + (dinleyen ? 'true' : 'false') + '" aria-label="' + (dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor')
        + '" title="Konuşarak sor · tanımayı tarayıcı yapar"><svg viewBox="0 0 24 24" aria-hidden="true">'
        + '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>'
      : '';
    return yan + bas
      + (panel ? '<div class="king__akis king__akis--panel">' + panel + '</div>'
        : '<div class="king__akis" aria-live="polite">' + (akis.length ? balonlar : bos) + '</div>'
        + (cip ? '<div class="king__cipler" role="group" aria-label="Hazır cevaplar">' + cip + '</div>' : ''))
      + kipPanel()
      + '<form class="king__yaz" data-king-form data-ayar-disi>'
      + '<div class="king__arti-yer"><button type="button" class="king__arti' + (aracAcik ? ' is-acik' : '') + '" data-king="arac" aria-expanded="' + (aracAcik ? 'true' : 'false')
      + '" aria-label="Araçlar" title="Araçlar: fotoğraf, sayfayı göster, hafıza, kaydet">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>' + aracMenu() + '</div>'
      + '<input type="file" accept="image/*" data-king-dosya class="sr-only"/>'
      + '<input class="king__girdi" type="text" aria-label="King\'e yaz" placeholder="' + (dinleyen ? 'Dinliyorum…' : kip() === 'ekran' ? 'Ekran hakkında sor…' : 'King\'e yaz…') + '" autocomplete="off" enterkeyhint="send"/>'
      + derinHtml() + mik
      + '<button type="submit" class="king__gonder" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button></form></div>';
  }

  function ciz(odak){
    if(typeof document === 'undefined') return;
    const k = document.querySelector('[data-king]');
    if(!k) return;
    const kutu = k.querySelector('.king__kutu');
    /* Kaydırma yeri korunur (2026-10-18, «yukarı aşağı kaydırmada sıkışıyor,
       titriyor»): her çizim listeyi en alta atıyordu; yukarıda okurken gelen
       bir durum çizimi seni aşağı çekiyordu. Altta ya da yeni mesaj varsa
       alta, değilse kaldığın yerde. */
    const eski = kutu.querySelector('.king__akis');
    const yeniVar = akis.some(m => m.yeni);
    const altta = !eski || eski.scrollHeight - eski.scrollTop - eski.clientHeight < 48;
    const yer = eski ? eski.scrollTop : 0;
    kutu.innerHTML = govde();
    k.classList.toggle('is-yan-acik', !mini && yanAcik);
    k.classList.toggle('is-yan-dar', !mini && yanDar());
    const g = kutu.querySelector('.king__girdi');
    const akisEl = kutu.querySelector('.king__akis');
    if(akisEl) akisEl.scrollTop = (altta || yeniVar) ? akisEl.scrollHeight : yer;
    /* Söz 27: paylaşılan ekranın canlı önizlemesi (aynı video öğesi taşınır). */
    const onz = kutu.querySelector('[data-king-onizle]');
    if(onz && paylasim && paylasim.video && paylasim.video.nodeType === 1){
      paylasim.video.className = 'king__ekran-video';
      paylasim.video.setAttribute('aria-hidden', 'true');
      onz.appendChild(paylasim.video);
    }
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
    dunuArsivle();
    akis = (o && Array.isArray(o.onceki) && o.onceki.length)
      ? o.onceki.filter(m => m && m.metin).map(m => ({ kim:m.kim === 'sen' ? 'sen' : 'king', metin:String(m.metin) }))
      : geriGetir();
    cipler = null; bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenFoto = null; sesli = false;
    if(o && o.mesaj) akis.push({ kim:'king', metin:o.mesaj });
    else if(!mini) tanismaHazirla();   // söz 22: günde en çok bir soru (çıkarım Onaylar'da, söz 23)
    const el = document.createElement('div');
    el.className = 'king';
    el.setAttribute('data-king', '');
    /* Perde: arka plan hafifçe kararır (odak baloncukta); dokununca kapanır. */
    el.innerHTML = '<div class="king-perde" aria-hidden="true"></div><div class="king-isik" aria-hidden="true"></div>'
      + '<div class="king__kutu" role="dialog" aria-modal="false" aria-label="King ile konuş"></div>';
    if(mini) el.classList.add('is-mini');
    document.body.appendChild(el);
    tasimaYaz();
    cubukIsaretle();
    document.documentElement.classList.add(mini ? 'king-mini' : 'king-acik');
    ciz(mini ? false : undefined);
    /* Odak katmanı: soldaki kenar King'i açan tıkla uyanmış olabilir;
       hareketsiz ve sakin kalır (kabuk.js «sakin kenar»). */
    if(L.KABUK && typeof L.KABUK.kenarSakinlestir === 'function'){ try{ L.KABUK.kenarSakinlestir(); }catch(e){ /* kabuk yok */ } }
    /* Bir kare sonra: geçiş başlasın (ışık süzülür, baloncuk yükselir). */
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-acik')));
  }

  /* Büyük King sayfayı kilitler (king.css html.king-acik). Sayfa kayabiliyorsa
     çubuğun yeri korunur; yoksa boş bir şerit açılmaz. Kilitten ÖNCE ölçülür. */
  function cubukIsaretle(){
    const h = document.documentElement;
    h.classList.toggle('king-cubuk', h.scrollHeight > h.clientHeight);
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
    cubukIsaretle();
    document.documentElement.classList.add('king-acik');
    ciz();
  }
  /* Modül: ekran değişti (go). Küçük kutunun başlığı tazelenir; odak çalınmaz. */
  function ekranDegisti(){ if(acik && mini) ciz(false); }

  function kapat(){
    if(!acik || typeof document === 'undefined') return;
    acik = false;
    mini = false;
    sesliSohbet = false; bekleyenFoto = null; menu = null; silOnay = null; mikNot = '';
    ortam.depo.sil(TASIMA);
    if(paylasim){ const p = paylasim; paylasim = null; try{ p.bitir(); }catch(e){ /* durmuş */ } }
    if(mikDeniyor){ const d = mikDeniyor; mikDeniyor = null; try{ d.iptal(); }catch(e){ /* durmuş */ } }
    if(dinleyen){ try{ dinleyen.abort ? dinleyen.abort() : dinleyen.stop(); }catch(e){ /* kapalı */ } dinleyen = null; }
    /* Sayfaya giderken söylenen cümle yarıda kesilmesin; elle kapatınca susar. */
    if(!sesli) sus();
    const el = document.querySelector('[data-king]');
    if(!el) return;
    el.classList.remove('is-acik');
    el.classList.add('is-kapaniyor');
    document.documentElement.classList.remove('king-acik', 'king-mini', 'king-cubuk');
    setTimeout(() => el.remove(), 360);
  }

  /* ------------------------------------------------------- olaylar */

  let bagli = false, sonCtrl = 0, baskaTus = false, basili = null;
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('keydown', e => {
      /* Söz 21 ek: boş kutuda ↑ son mesajı geri getirir. */
      if(e.key === 'ArrowUp' && acik && e.target && e.target.matches && e.target.matches('.king__girdi') && !e.target.value){
        const son = akis.filter(m => m.kim === 'sen' && !m.foto && m.metin).slice(-1)[0];
        if(son){ e.preventDefault(); e.target.value = son.metin; try{ e.target.setSelectionRange(son.metin.length, son.metin.length); }catch(er){ /* yok */ } }
        return;
      }
      if(e.key === 'Escape' && acik && menu){ e.preventDefault(); menu = null; silOnay = null; ciz(false); return; }
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
      /* Dar ekranda açık kenar çubuğu: sohbete dokununca kapanır (söz 26). */
      if(yanAcik && t.closest('.king__ana') && !t.closest('[data-king="yan"]')){ yanAcik = false; ciz(false); return; }
      const k = t.closest('[data-king]');
      if(!k){ if(acik && !mini) kucult(); return; }
      if(konusuyor > 0 && t.closest('.king__kure')){ sus(); return; }
      const h = t.closest('[data-king-hazir]');
      if(h){ hazirSec(Number(h.getAttribute('data-king-hazir'))); return; }
      const c = t.closest('[data-king]:not(.king)');
      if(c){
        const is = c.getAttribute('data-king');
        if(aracAcik && is !== 'arac') aracAcik = false;          // söz 27: menüden seçince kapanır
        if(derinAcik && is !== 'derin') derinAcik = false;       // söz 31: aynı kural
        if(is === 'derin'){ derinAcik = !derinAcik; aracAcik = false; ciz(false); return; }
        if(/^derinlik:(oto|hizli|dengeli|derin)$/.test(is)){ derinlikSec(is.slice(9)); return; }
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
        if(/^yazma:(yaz|ses):[01]$/.test(is)){ const p = is.split(':'); yazmaSec(p[1], p[2] === '1'); return; }
        if(/^kopyala-mesaj:\d+$/.test(is)){
          const m = akis[Number(is.split(':')[1])];
          if(m){
            const metin = [m.metin].concat(m.satirlar || [], m.onizleme ? [m.onizleme.metin] : [], m.son ? [m.son] : []).filter(Boolean).join('\n');
            Promise.resolve(ortam.kopyala(metin)).then(ok => {
              if(!ok) return;
              c.classList.add('is-kopyalandi'); c.setAttribute('aria-label', 'Kopyalandı');
              setTimeout(() => { c.classList.remove('is-kopyalandi'); c.setAttribute('aria-label', 'Cevabı kopyala'); }, 1400);
            });
          }
          return;
        }
        if(/^env:[1-5]$/.test(is) && envanter){ akis.push({ kim:'sen', metin:is.slice(4) }); envanterIlerle(Number(is.slice(4))); return; }
        if(is === 'env-dur'){ envanter = null; cipler = null; soyle('Tamam, envanteri bıraktım; istediğin zaman «kişilik testi» de.'); return; }
        if(is === 'sorma-sifirla'){ ortam.depo.sil(SORMA); ciz(false); return; }
        if(is === 'tanisma-atla'){ bekleyenTanisma = null; cipler = null; soyle('Tamam, başka zaman.'); return; }
        if(is === 'kisi'){ menuAc('kisi'); disKisiTazele().then(() => { if(acik && menu === 'kisi') ciz(false); }); return; }
        if(/^kisi-izin:[a-z]+:(ays|spi|esp)$/.test(is)){
          const p = is.split(':'), K = KISI(), H = hafiza();
          if(K){ K.izinDegistir(p[1], p[2], !K.izinli(p[1], p[2])); if(H && H.hkmeGonder) H.hkmeGonder(); ciz(false); }
          return;
        }
        if(/^kisi-sil:/.test(is)){ const H = hafiza(); if(H) H.unut(is.slice(9)).then(() => ciz(false)); return; }
        if(is === 'kisi-ekle'){
          const H = hafiza(), kt = c.closest('.king__menu');
          const al = kt && kt.querySelector('[data-kisi-alan]'), gi = kt && kt.querySelector('[data-kisi-metin]');
          const alan = al ? al.value : 'sevgi', m = gi ? gi.value.trim() : '';
          if(H && m) H.ekle(m, { katman:'soz', kaynak:'kullanici', alan }).then(() => { kisiYeni = { alan, metin:'' }; ciz(false); });
          return;
        }
        if(is === 'yetki-onay'){ yetkiUygula(); return; }
        if(is === 'yetki-hepsi'){ const Y = yetkiKatalog(); const n = Y && Y.anla('hepsini onayla'); if(n && n.tur === 'eylem') yetkiUygula(n); return; }
        if(is === 'menu'){ menuAc('menu'); return; }
        if(is === 'kayitlar'){ menuAc('kayitlar'); return; }
        if(is === 'yeni-sohbet'){ yeniSohbet(); return; }
        if(/^kip:(yaz|dinle|konus|ekran)$/.test(is)){ aracAcik = false; kipSec(is.slice(4)).then(() => ciz(false)); return; }
        if(is === 'arac'){ aracAcik = !aracAcik; ciz(false); return; }
        if(is === 'sus'){ sus(); return; }
        if(is === 'ekran-sor'){ isle('Ekranda ne görüyorsun? Kısaca söyle.'); return; }
        if(is === 'klasor-yeni'){ klasorYeni = !klasorYeni; ciz(false); const g = document.querySelector('[data-king-klasor-ad]'); if(g) try{ g.focus(); }catch(e){} return; }
        if(/^klasor-sil:/.test(is)){ klasorSil(is.slice(11)); ciz(false); return; }
        if(/^gecmis-sil:/.test(is)){ kayitSil(is.slice(11)); return; }
        if(/^sabitle:/.test(is)){ kayitSabitle(is.slice(8)); ciz(false); return; }
        if(/^adlandir:/.test(is)){ adlandirilan = is.slice(9); ciz(false); const g = document.querySelector('[data-king-ad]'); if(g) try{ g.focus(); g.select(); }catch(e){} return; }
        if(/^tasi:/.test(is)){ tasinan = tasinan === is.slice(5) ? null : is.slice(5); ciz(false); return; }
        if(/^tasi-yap:/.test(is)){ const p = is.slice(9).split(':'); kayitTasi(p[0], p[1] || null); tasinan = null; ciz(false); return; }
        if(is === 'yan'){ yanDugme(); return; }
        if(/^kayit-ac:/.test(is)){ kayitAc(is.slice(9)); return; }
        if(is === 'foto-sec'){ const f = document.querySelector('[data-king-dosya]'); if(f) f.click(); return; }
        if(is === 'sohbet-kaydet'){ menu = null; sohbetiKaydet(); return; }
        if(is === 'temizle'){ menu = null; sohbetiTemizle(); return; }
        if(is === 'geri-getir'){ sohbetiGeriGetir(); return; }
        if(/^cevap:/.test(is)){ cevapSec(is.slice(6)); return; }
        if(/^ses:/.test(is)){ sesTercihSec(is.slice(4)); return; }
        if(/^algila:/.test(is)){ const v = is.slice(7); if(ALGILA_TERCIH.indexOf(v) >= 0){ if(v === 'oto') ortam.depo.sil(ALGILA); else ortam.depo.yaz(ALGILA, v); hkmDinlemez = false; } ciz(false); return; }
        if(is === 'mik-dene'){ mikDene(); return; }
        if(/^hiz:/.test(is)){ const v = Number(is.slice(4)); if(HIZLAR.indexOf(v) >= 0) ortam.depo.yaz(HIZ, v); ciz(false); return; }
        if(is === 'hiz-sonraki'){ ortam.depo.yaz(HIZ, HIZLAR[(HIZLAR.indexOf(hiz()) + 1) % HIZLAR.length]); ciz(false); return; }
        if(is === 'ses-sonraki'){ sesTercihSec(SES_TERCIH[(SES_TERCIH.indexOf(sesTercihi()) + 1) % SES_TERCIH.length]); return; }
        if(/^kayit:/.test(is)){ menu = { id:is.slice(6) }; silOnay = null; ciz(false); return; }
        if(/^indir:/.test(is)){ kayitIndir(is.slice(6)); return; }
        if(/^kopyala:/.test(is)){ kayitKopyala(is.slice(8)); return; }
        if(/^sil:/.test(is)){ kayitSil(is.slice(4)); return; }
        if(/^foto:\d+$/.test(is)){ fotoIsle(Number(is.slice(5))); return; }
        if(is === 'kaydet') kaydet();
        else if(is === 'git-onay') gitOnayla();
        else if(is === 'vazgec') vazgec();
      }
    }, true);
    /* Söz 11: fotoğraf — düğme, yapıştır, sürükle-bırak; söz 29: mikrofon seçimi. */
    document.addEventListener('change', e => {
      const m = e.target && e.target.matches && e.target.matches('[data-king-mik]') ? e.target : null;
      if(m){ mikSec(m.value); return; }
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
    /* Söz 27: yeni klasör formu ve geçmişte arama. */
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-klasor]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('[data-king-klasor-ad]');
      if(klasorEkle(g ? g.value : '')){ klasorYeni = false; ciz(false); }
    });
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-adlandir]') : null;
      if(!f) return;
      e.preventDefault();
      const g = f.querySelector('[data-king-ad]');
      kayitAdlandir(f.getAttribute('data-king-adlandir'), g ? g.value : '');
      adlandirilan = null; ciz(false);
    });
    document.addEventListener('input', e => {
      const g = e.target && e.target.matches && e.target.matches('[data-king-ara-girdi]') ? e.target : null;
      if(!g) return;
      const q = g.value.toLocaleLowerCase('tr').trim();
      document.querySelectorAll('[data-king] [data-king-ara]').forEach(li => { li.hidden = !!q && li.getAttribute('data-king-ara').indexOf(q) < 0; });
    });
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
    disKisi = [];
    if(hafiza()) disKisiTazele();              // söz 22: öbür modüllerde öğrenilen
    /* Söz 18: başka modülden King açık gelindiyse burada küçük kutu olarak
       sohbetiyle açılır; kendi modülünün eski taşıması yalnız silinir. */
    const ts = ortam.depo.oku(TASIMA);
    if(ts) ortam.depo.sil(TASIMA);
    const tasindi = !!(ts && ts.acik && ts.kaynak && (ts.kaynak !== ayar.modul || (ts.yenile && Date.now() - (Number(ts.zaman) || 0) < 60 * 1000))
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
    if(tasindi) ortam.zamanla(() => ac({ mini:true, onceki,
      mesaj:ts.yenile && ts.kaynak === ayar.modul ? 'Tamam, sayfa yenilendi; buradayım.' : MODUL_AD[ayar.modul] + '’ye geçtik, buradayım.' }), 60);
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
    if(ayar) ortam.depo.sil(arsivAnahtar());
    ortam.depo.sil(CEVAP); ortam.depo.sil(ALGILA); ortam.depo.sil(MIK);
    menu = null; silOnay = null; silinen = null; bekleyenYetki = null; bekleyenTanisma = null; disKisi = [];
    yanAcik = false; aktifKayit = null; aracAcik = false; derinAcik = false; klasorYeni = false; tasinan = null; adlandirilan = null;
    if(ayar) ortam.depo.sil(klasorAnahtar());
    ortam.depo.sil(CIKARIM_KARAR); ortam.depo.sil(SORMA);
    envanter = null; ortam.depo.sil(USLUP);
    ortam.depo.sil(TANISMA);
    ayar = null; acik = false; mini = false; akis = []; bekleyenFoto = null; sonGeriAl = null; sesliSohbet = false; sessizSay = 0; cipler = null; bekleyen = null; bekleyenGit = null; bekleyenIlet = null;
    if(mikDeniyor){ try{ mikDeniyor.iptal(); }catch(e){ /* durmus */ } mikDeniyor = null; }
    mikListe = []; mikNot = ''; hkmDinlemez = false;
    if(dinleyen){ try{ dinleyen.onend = dinleyen.onerror = null; dinleyen.abort(); }catch(e){ /* durmus */ } }
    sesli = false; dinleyen = null; konusuyor = 0; sesNo++; calan = null; sonMotor = ''; sonNot = '';
  }

  return {
    kur, ac, kapat, kucult, buyut, ekranDegisti, yorumla, isle, hazirSec, kaydet, dinle, sesSec, veriGibi,
    fotoAl, fotoIsle, ekranOku, ekranGoster, sesliSohbetAc, geriAlYap, sesliSohbetMi:() => sesliSohbet,
    paylasimBaslat, paylasimBitir, paylasimVar:() => !!paylasim, fotoYorumla, GORSEL_SISTEM, TASIMA,
    kisiKayitlari, kisiOzeti, disKisiTazele, tanismaVar:() => !!bekleyenTanisma,
    cikarimAdaylari, cikarimKarti, cikarimOnayla, SORMA, sormaKomutu, sormaMi, sormaListesi,
    USLUP, envanterVar:() => !!envanter,
    yetkiUygula, bekleyenYetki:() => bekleyenYetki,
    CEVAP, cevapBicimi, cevapSec, SES, sesTercihi, sesTercihSec, sesParcalari, seslendir, sus, wavYap, sonMotor:() => sonMotor, sonNot:() => sonNot, YAN, yanDar, yanDarSec, DERIN, derinlik, derinlikSec,
    MIK, mikSecili, mikSec, mikTazele, mikDene, algila,
    sohbetiKaydet, sohbetiTemizle, sohbetiGeriGetir, kayitlar:arsivOku, kayitIndir,
    kayitKopyala, kayitSil, kayitMetni, menuAc, menuDurum:() => menu,
    yeniSohbet, kayitAc, ARACLAR, aktifKayit:() => aktifKayit,
    KIPLER, kip, kipSec, klasorler, klasorEkle, klasorSil, kayitTasi, kayitAdlandir, kayitSabitle,
    acikMi:() => acik, miniMi:() => mini, akis:() => akis.slice(),
    SAYFALAR, HAZIR, _ortam:ortam, _sifirla,
  };
})();
