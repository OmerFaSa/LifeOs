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
      (yapay zekâ) bağlıyken görünür; yerel King model kullanmaz.
  32. KARTLAR (depo sahibi, 2026-10-19: «istatistik sorduğumuzda King
      minik kartları önümüze koysun; bir konuda soru sor dediğimizde
      sistemden soruyu çekip kart olarak koysun»). Tetik KURALDIR, model
      çağrılmaz:
        «istatistiklerim», «rakamlarım», «kartları göster»  istatistik kartları
        «bana soru sor», «türev hakkında soru sor»          soru kartı
      Kartın SAYISINI modül kendi koduyla üretir (kur'daki kartlar.istatistik);
      King yalnız gösterir. Her kart etiket taşır (ölçüldü · hesaplandı ·
      tahmin · veri yok); değeri olmayan kart «—» ve «veri yok»tur, sıfır
      yazılmaz. Soru kartı modülün bankasından gelir (kartlar.soru; şimdilik
      AYS Öğren) ve şıklar düğmedir; cevabı modülün kendi kodu kaydeder
      (kartlar.cevapla; Öğren söz 3: ilk cevap ölçümdür). Ardından doğru şık
      ve çözüm görünür, «Bir soru daha» kalır. Bankası olmayan modül bunu
      söyler. Uzun cevapta **kalın** ve madde işaretleri biçimlenir, satır
      sonları korunur.
  33. GENEL GELİŞTİRME (depo sahibi, 2026-10-19: «hepsini King'e getir,
      arayüzü profesyonelleştir; King neredeyse her şeyi yapsın»):
        Akan cevap      yazı HKM'den cümle cümle akar (/api/chat/akis);
                        her cümle denetimden geçmişse görünür, sonda tam
                        cevap yerine geçer. Eski HKM'de /api/chat'e düşer.
        Sohbet başı     her sohbet kendi geçmişini taşır (baslangic); kalıcı
                        hafıza (onaylanan bilgiler) etkilenmez.
        Öneri düğmeleri Merkez'in cevabının altında: Detaylandır, Kısalt,
                        Kartları göster, Bana soru sor (koddan).
        Günün açılışı   günün ilk açılışında selam, özet ve modülün kartları
                        (sesli okunmaz); pazar «Haftalık değerlendirme».
        Merkez komutu   «haftalık değerlendirme» → HKM'nin «hafta» raporu,
                        «çapraz bulgu» → «capraz»; sayıları kural motoru yazar.
        Odak sayacı     «25 dakika matematik çalışalım», «pomodoro»; başlıkta
                        kalan süre; bitince haber ve «Kaydet» (modülün kendi
                        girişine gider, onaysız yazılmaz). TASINAN'da.
        Tarz            ··· menüsünde Samimi · Resmi · Kısa (lifeos.king.tarz).
        Ayar komutu     «sesi Piper yap», «derin düşün», «hızlı cevap ver»,
                        «cevapları sesli oku», «resmi konuş», «daha hızlı oku».
        Araya girme     Konuş kipinde King konuşurken sen konuşursan susar ve
                        seni dinler (mikrofon eşiği yüksek; yankı engelleme açık).
        Kart grafiği    kartta `seri` varsa son günlerin küçük çizgisi; eksik
                        gün boşluk kalır (sıfır çizilmez).
        Eylem kapısı    modüller YETKİ kataloğuna kendi küçük/orta eylemlerini
                        ekler (toplantı başlatmak gibi; yetki.js söz 8).
  34. İŞE YARAYAN FİKİRLER (depo sahibi, 2026-10-19). Hepsinde sayıyı modülün
      kodu üretir; King gösterir, model yalnız anlatır:
        Puan önceliği   «neye çalışayım» → modülün öncelik listesi (AYS:
                        çıkma sıklığı × hata), sıra ve neden; satırdan Öğren.
        Not arama       «notlarımda türev», «… not almıştım» → Defter'de
                        arar; Merkez bağlıysa yalnız o notlara dayanarak
                        cevaplar ve kaynağı yazar; değilse notları listeler.
        Tekrar soruları «bana soru sor» önce vadesi gelen tekrarı sorar
                        (yanlış yaptığın soru 1, 3, 7 gün sonra; AYS).
        Haftalık ritüel «haftalık gözden geçirme»: rapor, üç soru (ne iyi
                        gitti, ne zorladı, haftanın tek hedefi); cevaplar
                        Defter'e not olur, hedef her sabah açılışta görünür.
        Yük             «yük durumum» → modülün son 7 gün / önceki 7 gün
                        kartları ve kuralı tutan sinyal (teşhis yok).
        Günlük          «günlük yazalım» → anlattığın Defter'e günlük olur;
                        günün hissini (1–5) SEN verirsin, nota yazılır.
        Kişisel deney   «deney başlat <kural>» → ölçüyü seç; süre sonunda
                        önceki ve deney dönemi ortalaması kodla karşılaştırılır;
                        az veriyle «yetersiz» denir; neden-sonuç iddiası yok.
        Verimli saat    AYS kartı: saati kayıtlı bloklardan en iyi dilim.
  35. SOHBETTEN KAYIT (depo sahibi, 2026-10-19: «sohbet arasında günümü
      günlük yazar gibi anlatacağım; King aradan bulup kaydetsin»). Uzun
      bir anlatım cümlelerine ve bağlaçlarına bölünür; her parça önce bu
      modülün KENDİ ayrıştırıcısından (veri kapısı, giris.js) geçer, olmazsa
      niyet tablosu öbür modülü bulur. Gelecek, olumsuz ve soru cümlesi kayıt
      sayılmaz (olumsuz.js olcumEngeli). Bulunanlar TEK kartta işaret
      kutularıyla görünür; «Seçilenleri kaydet» denmeden hiçbir şey yazılmaz
      (§1.1: ölçüm onaysız yazılmaz):
        bu modülün kaydı   modülün kendi kaydet'i
        öbür modülün kaydı oturum varsa o modülün Onaylar'ına (gelen kutusu);
                           yoksa bekleyen kayıt olur (TASINAN) ve o modülde
                           King açılınca o modülün ayrıştırıcısıyla yeniden
                           önizlenip onay ister
        günlük             uzun anlatım istenirse Defter'e günlük olur
      Kart gösterilirken sohbet sürer: Merkez bağlıysa King cevabını da yazar.
      Ayrıntı (2026-10-19): «…, 4 yanlışım var», «32'si doğru» öncekine bağlı
      kalır (modül doğru/yanlışı kendisi çözer); duygu cümleleri («memnunum,
      seviniyorum, yoruldum») kayıt değildir ama kaybolmaz: günlük öğesine
      girer ve öğe kendiliğinden işaretli gelir. Sayıya çevrilmez; günün
      hissini yalnız kullanıcı verir.
  36. HER İŞ SOHBETTEN (depo sahibi, 2026-10-20, King 2.0 B: «kullanıcı
      modüllere gitmeden King'le konuşarak her şeyi halledebilsin»). King'in
      ve modülün araçları tek tip bir katalogdadır (brand/ortak/arac.js):
      ad, açıklama, JSON şemalı parametreler, tür «oku» ya da «yaz».
        Seçim       Merkez bağlıysa katalog modele gider; model yalnız hangi
                    aracı hangi parametreyle çağıracağını seçer (HKM/core/
                    arac.py doğrular, burada bir kez daha doğrulanır;
                    bilinmeyen araç ve geçersiz parametre reddedilir).
        Okuma       aracı modülün kodu çalıştırır; sonuç ikinci turda
                    Merkez'e gider, model yalnız cümleye çevirir ve cevaptaki
                    sayı sonuca karşı denetlenir. Kendi cevabını yazan araç
                    (sayfa aç, kart, öncelik) ikinci tur istemez.
        Yazma       önce önizleme, mevcut onay kartıyla (kayıt için «Evet,
                    ekle», değişiklik için «Onayla»); onaysız uygulanmaz.
                    Kayıtta önce kullanıcının KENDİ cümlesi denenir; modelin
                    cümlesindeki her sayı kullanıcının cümlesinde geçmeli.
        Harita      «bu sistemde ne var», «… nerede», «… nasıl yapılır»
                    modelsiz cevaplanır: modüllerin işleri, sayfalar ve bu
                    modülün araçları (örnek cümlesiyle).
      Model yokken kural yolları (NIYET, giriş kapısı, yetki) aynen sürer;
      `es` taşıyan okuma aracı kuralla çağrılır.
  37. HER ŞEY KING'DE (depo sahibi, 2026-10-21, King 3.0 K5: «SPİ veya o
      şeylerin içindeki şeyleri de King yapabilsin; barkod okumak gibi …
      hepsi tek bir alanda toplansın»).
        Tek alan    «+ › Tüm işler» üç modülün King'le yapılan işlerini modüle
                    göre gösterir (arac.js ISLER); harita da aynı listeyi
                    modüle göre söyler. Başka modülün işi seçilirse King o
                    modüle geçer ve iş orada açılır; cümle işinde örnek
                    yazı alanına konur, gönderilmez.
        Kamera      modülün fotoğraf işleri (`ayar.foto`: SPİ barkod ve
                    öğün, AYS soru, ESP kitap sayfası) kamera kipinde tek
                    düğmeyle o anki kareyle çalışır; kare dosya olur ve aynı
                    akışa girer. Kare saklanmaz.
        Yardım      fotoğraf işi ikinci argümanla görüntü okuma ister
                    (`gorsel(soru, yetenek)`: Merkez'in görsel kademesi);
                    iş { metin, satirlar, arac } döndürürse aracın önizlemesi
                    onay kartıyla gösterilir, yalnız «Onayla» ile yazılır.
  38. ARAŞTIRMA KARTI (2026-10-21, H1: HKM'nin sabit şablonu arastirma.v1).
      «X'i araştır» cevabı kart olur: Özet (kaynaklı 2–3 cümle; «Dinle» sesli
      okur), İzle (video, kanal, süre, dil, konunun geçtiği andan açılan
      link), Oku (site ve kaynağın kendi cümlesi), Sıradaki adım (Defter'e
      kaynak olarak ekleme; not aracının onay kartıyla). Linkler yeni sekmede
      (masaüstünde tarayıcıda) açılır; yalnız http(s) link çizilir. Metni ve
      linkleri HKM'nin kodu kurar; King yalnız çizer.
  39. BÜYÜK PENCERE, G AŞAMASI (2026-10-21, kullanıcı: «daha profesyonel, daha
      ustaca, sisteme daha uyacak şekilde»; belgeler/ekip/KING-ARAYUZ.md).
      Solda ray (Sohbet, Görevler, Rutinler, Kütüphane; altta Ayarlar),
      yanında seçili bölümün listesi (sohbetler günlere göre), ortada
      sohbet, sağda çalışma alanı (görev panosu, rutinler, araştırma,
      önizleme, ayarlar; sohbet kapanmaz). Başlıkta yalnız küre, modül,
      canlı iş rozeti, kip, küçült, kapat. Yazma kutusu tek parça: «+»
      (fotoğraf, kamera, ekran, PDF, barkod), metin, mikrofon (dokun: söyle;
      basılı tut: sesli sohbet), gönder. Önerinin altında «Neden?» yalnız
      bilinen kaynağı söyler. PDF'in metnini Merkez çıkarır (model yok). */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.KING_IC = {};

/* KING · çekirdek: katalog, ortam, durum, anlama, HKM bağı, eylem.
   Parça 1/8; yükleme sırası: king.js, king-ses.js, king-kayit.js, king-gorunum.js, king-kart.js, king-arac.js, king-devrim.js, king-yol.js.
   Dosyalar arası ortak adlar ve ortak durum window.LIFEOS.KING_IC'tedir (KI.ad).
   Kural: başka parçadaki ada KI.ad ile erişilir; parçalar arası okunan yeni ad,
   tanımlandığı parçanın sonundaki Object.assign(KI, …) satırına eklenir. Birden çok
   parçanın okuduğu ve yazılan durum (let) yalnız KI.ad olarak yaşar. */
(function(){
  'use strict';

  const KI = window.LIFEOS.KING_IC;


  const L = window.LIFEOS;
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };

  /* Sayfalar: «şu sayfaya git». es = aranan sözcükler (küçük harf). */
  const SAYFALAR = [
    { modul:'spi', route:'today',     ad:'Bugün',      es:['bugün', 'genel bakış', 'ölçüm'] },
    { modul:'spi', route:'meals',     ad:'Öğün',       es:['öğün', 'besin', 'yemek', 'beslenme'] },
    { modul:'spi', route:'kitchen',   ad:'Mutfak',     es:['mutfak', 'mutfağ', 'tarif'] },
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
    zamanIptal:id => clearTimeout(id),
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
    /* G: PDF Merkez'e base64 gider. */
    dosyaB64:f => new Promise((ok, ret) => {
      const r = new FileReader();
      r.onload = () => { const s = String(r.result || ''); ok(s.slice(s.indexOf(',') + 1)); };
      r.onerror = () => ret(r.error || new Error('Dosya okunamadı'));
      r.readAsDataURL(f);
    }),
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
    ekranBaslat:async bitince => videoKaynak(await navigator.mediaDevices.getDisplayMedia({ video:{ frameRate:{ ideal:2, max:5 } }, audio:false }), bitince),
    /* Kamera kipi (2026-10-21): masadaki kâğıt, kitap; kare yalnız sorulunca ya da göz bakınca alınır. */
    kameraDestek:() => !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    kameralar:async () => {
      if(typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') return [];
      try{
        const l = await navigator.mediaDevices.enumerateDevices();
        /* İzin verilmeden önce kimlik ve ad boş gelir; kamera yine «var» sayılır. */
        return (l || []).filter(d => d && d.kind === 'videoinput')
          .map((d, i) => ({ id:d.deviceId || '', ad:String(d.label || '').trim() || ('Kamera ' + (i + 1)) }));
      }catch(e){ return []; }
    },
    kameraBaslat:async (bitince, cihazId) => {
      const v = { width:{ ideal:1280 }, height:{ ideal:720 }, frameRate:{ ideal:5, max:15 } };
      if(cihazId) v.deviceId = { exact:cihazId };
      return videoKaynak(await navigator.mediaDevices.getUserMedia({ video:v, audio:false }), bitince);
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
    /* Söz 33: odak bitince sistem bildirimi (izin verilmişse). */
    bildir:(baslik, metin) => { try{ if(typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(baslik, { body:metin }); }catch(e){ /* yok */ } },
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
      && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ? async (sessiz, cihazId, basla, esik) => {
      /* Söz 33: `basla` sürekli konuşma (0,25 sn) başlayınca bir kez çağrılır; `esik` RMS eşiği.
         K3 (araya girme): kesici kaydı `devral` ile normal dinlemeye döner; kayıt
         konuşmanın 0,4 sn öncesinden başlar (ilk hece kaybolmaz). */
      let ESIK = typeof esik === 'number' ? esik : 0.02;
      let konusmaN = 0, basladi = false, basOrnek = 0;
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
        if(Math.sqrt(t / d.length) > ESIK){ konustu = true; sessizN = 0; konusmaN += d.length; } else { konusmaN = 0; if(konustu) sessizN += d.length; }
        const hz = ctx.sampleRate;
        if(basla && !basladi && konusmaN > hz * 0.25){
          basladi = true; basOrnek = Math.max(0, toplam - konusmaN - Math.round(hz * 0.4));
          try{ basla(); }catch(e){ /* dinleyen yok */ }
        }
        /* Kesici kaydı King konuşurken uzun sürebilir: konuşma başlamadıysa yalnız son 2 sn tutulur. */
        if(basla && !basladi && toplam > hz * 4){ while(parca.length > 1 && toplam - parca[0].length > hz * 2){ toplam -= parca.shift().length; } }
        if(!bitti && ((konustu && sessizN > hz * 1.4) || toplam - basOrnek > hz * 60 || (!konustu && toplam > hz * 8))) sessiz();
      };
      kaynak.connect(isle); isle.connect(ctx.destination);
      return { devral:(yeniSessiz, yeniEsik) => { sessiz = yeniSessiz; if(typeof yeniEsik === 'number') ESIK = yeniEsik; sessizN = 0; konustu = true; },
        bitir:() => {
        bitti = true;
        try{ isle.disconnect(); kaynak.disconnect(); }catch(e){ /* kopuk */ }
        try{ akis.getTracks().forEach(t => t.stop()); }catch(e){ /* durmus */ }
        const hz = ctx.sampleRate;
        try{ ctx.close(); }catch(e){ /* kapali */ }
        const pcm = new Float32Array(toplam);
        let o = 0;
        parca.forEach(p => { pcm.set(p, o); o += p.length; });
        return { pcm:basOrnek ? pcm.subarray(Math.min(basOrnek, pcm.length)) : pcm, hz, konustu };
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
    /* K3: akan ses (HKM /api/ses/akis: 16 bit tek kanal PCM). Her parça gelir
       gelmez sıraya konup çalınır; ilk kelime ilk parçayla duyulur. Döner:
       'bitti' | 'olmadi' (hiç ses gelmedi ya da çalınamadı). */
    pcmCal:(typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ? (res, hz, tut) => new Promise(ok => {
      let ctx = null, okuyucu = null, bitti = false, zaman = 0, son = null, calindi = false, artik = null;
      const kapat = s => {
        if(bitti) return;
        bitti = true;
        try{ const c = okuyucu && okuyucu.cancel(); if(c && c.catch) c.catch(() => {}); }catch(e){ /* kapalı */ }
        try{ const c = ctx && ctx.close(); if(c && c.catch) c.catch(() => {}); }catch(e){ /* kapalı */ }
        ok(s);
      };
      try{
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        if(ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {});
        okuyucu = res.body.getReader();
      }catch(e){ return kapat('olmadi'); }
      tut({ dur:() => kapat('bitti') });
      const ekle = v => {
        let b = v instanceof Uint8Array ? v : new Uint8Array(v);
        if(artik){ const t = new Uint8Array(artik.length + b.length); t.set(artik); t.set(b, artik.length); b = t; artik = null; }
        const n = b.length >> 1;
        if(b.length & 1) artik = b.slice(b.length - 1);
        if(!n) return;
        const dv = new DataView(b.buffer, b.byteOffset, n * 2), buf = ctx.createBuffer(1, n, hz), d = buf.getChannelData(0);
        for(let i = 0; i < n; i++) d[i] = dv.getInt16(i * 2, true) / 32768;
        const src = ctx.createBufferSource();
        src.buffer = buf; src.connect(ctx.destination);
        zaman = Math.max(zaman, ctx.currentTime + 0.03);
        src.start(zaman);
        zaman += buf.duration;
        son = src; calindi = true;
      };
      (async () => {
        for(;;){
          const { value, done } = await okuyucu.read();
          if(bitti) return;
          if(done) break;
          if(value && value.length) ekle(value);
        }
        if(!calindi) return kapat('olmadi');
        son.onended = () => kapat('bitti');
        /* Güvence: onended gelmezse kalan süre dolunca biter. */
        setTimeout(() => kapat('bitti'), Math.max(0, (zaman - ctx.currentTime) * 1000) + 400);
      })().catch(() => kapat(calindi ? 'bitti' : 'olmadi'));
    }) : null,
    /* K3: «King» deyince uyanma. Mikrofon düşük enerjiyle dinlenir: kod yalnız
       ses seviyesine bakar (model yok); 0,3–4 sn'lik kısa bir konuşma bitince
       o parça `parca(pcm, hz)` ile verilir. Uzun konuşma (başkasıyla sohbet,
       televizyon) hiç gönderilmez. Eşik ortamın gürültüsüne göre ayarlanır. */
    uyanikAc:(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ? async (parca, cihazId) => {
      const sesKisit = { echoCancellation:true, noiseSuppression:true, autoGainControl:true };
      if(cihazId) sesKisit.deviceId = { ideal:cihazId };
      const akis = await navigator.mediaDevices.getUserMedia({ audio:sesKisit });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const kaynak = ctx.createMediaStreamSource(akis);
      const isle = ctx.createScriptProcessor(4096, 1, 1);
      const hz = ctx.sampleRate;
      let taban = 0.01, once = [], onceN = 0, kayit = null, kayitN = 0, konusmaN = 0, sessizN = 0, uzun = false;
      isle.onaudioprocess = e => {
        const d = new Float32Array(e.inputBuffer.getChannelData(0));
        let t = 0;
        for(let i = 0; i < d.length; i++) t += d[i] * d[i];
        const rms = Math.sqrt(t / d.length), esik = Math.max(0.015, taban * 3), ses = rms > esik;
        if(!kayit && !uzun){
          if(!ses){ taban = taban * 0.95 + rms * 0.05; once.push(d); onceN += d.length; while(onceN - once[0].length > hz * 0.4){ onceN -= once.shift().length; } return; }
          kayit = once.concat([d]); kayitN = onceN + d.length; once = []; onceN = 0; konusmaN = d.length; sessizN = 0;
          return;
        }
        if(ses){ konusmaN += d.length; sessizN = 0; } else sessizN += d.length;
        if(uzun){ if(sessizN > hz * 0.8){ uzun = false; } return; }
        kayit.push(d); kayitN += d.length;
        if(konusmaN > hz * 4){ kayit = null; uzun = true; return; }
        if(sessizN > hz * 0.5){
          const k = kayit, n = kayitN, kn = konusmaN;
          kayit = null;
          if(kn < hz * 0.3) return;
          const pcm = new Float32Array(n);
          let o = 0;
          k.forEach(p => { pcm.set(p, o); o += p.length; });
          try{ parca(pcm, hz); }catch(er){ /* dinleyen yok */ }
        }
      };
      kaynak.connect(isle); isle.connect(ctx.destination);
      return { bitir:() => {
        try{ isle.disconnect(); kaynak.disconnect(); }catch(e){ /* kopuk */ }
        try{ akis.getTracks().forEach(t => t.stop()); }catch(e){ /* durmus */ }
        try{ ctx.close(); }catch(e){ /* kapali */ }
      } };
    } : null,
    gizli:() => typeof document !== 'undefined' && document.visibilityState === 'hidden',
  };
  /* HKM'deki King'in modelli cevabı yerel modelde saniyeler sürebilir. */
  const MERKEZ_ZAMAN_ASIMI = 60000;
  /* Uzun metin isteği (HKM/core/sohbet.py uzun_istek ile aynı kural): bekleme üç katı. */
  const UZUN_ISTEK = /(uzun|uzunca|detaylı|ayrıntılı|kapsamlı|derinlemesine)/i;
  const UZUN_YAZ = /(yaz|anlat|açıkla|metin|cevap|bilgi|makale|rapor|özetle)/i;

  KI.ayar = null;           // { modul, git(route, ek), ozet(), veri:{ onizle(metin) }, hkm() → Beacon }
  KI.acik = false;
  KI.akis = [];             // [{ kim:'king'|'sen', metin, satirlar? }]
  KI.cipler = null;         // null = hazır cevaplar; ya da [{ ad, is }]
  KI.bekleyen = null;       // veri önizlemesi
  KI.bekleyenGit = null;    // «açayım mı?» diye sorulan sayfa (söz 8)
  KI.yanAcik = false;       // söz 26: dar ekranda kenar çubuğu açık mı
  const YAN = 'lifeos.king.yan';   // söz 30: geniş ekranda kenar çubuğu kapalı mı ('dar')
  function yanDar(){ return ortam.depo.oku(YAN) === 'dar'; }
  function yanDarSec(dar){
    if(dar) ortam.depo.yaz(YAN, 'dar'); else ortam.depo.sil(YAN);
    KI.ciz(false);
    return yanDar();
  }
  function yanDugme(){
    if(ortam.genis()) yanDarSec(!yanDar());
    else{ KI.yanAcik = !KI.yanAcik; KI.ciz(false); }
  }
  /* Kenar çubuğunun düğmesi çubuğun İÇİNDE (2026-10-19, kullanıcı: «King'in
     yanında olmasın; kapatılınca orada bir çıkıntı kalsın»): açıkken
     «Yeni sohbet»in yanında kapat, kapalıyken pencerenin sol kenarında
     ince bir çıkıntı açar. İkisi aynı işi yapar, aynı durumu söyler. */
  function yanDugmeHtml(sinif){
    const gorunur = ortam.genis() ? !yanDar() : KI.yanAcik;
    const ad = gorunur ? 'Kenar çubuğunu kapat' : 'Sohbet geçmişini aç';
    const yol = sinif === 'king__cikinti' ? '<path d="M10 7l5 5-5 5"/>' : '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>';
    return '<button type="button" class="' + sinif + '" data-king="yan" aria-expanded="' + (gorunur ? 'true' : 'false')
      + '" aria-label="' + ad + '" title="' + ad + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + yol + '</svg></button>';
  }
  KI.aktifKayit = null;     // söz 26: geçmişten açılan sohbetin kimliği
  KI.aracAcik = false;      // söz 27: «+» menüsü açık mı
  KI.klasorYeni = false;    // söz 27: yeni klasör adı soruluyor mu
  KI.tasinan = null;        // söz 27: klasöre taşınacak sohbetin kimliği
  KI.adlandirilan = null;   // söz 27: yeniden adlandırılan sohbetin kimliği
  KI.bekleyenIlet = null;   // { modul, metin } öteki modüle iletilecek satır (söz 10)
  KI.mini = false;          // küçük kutu (söz 9)
  KI.bekleyenFoto = null;   // söz 11
  KI.fotoHedef = null;      // söz 37: «Tüm işler»den seçilen fotoğraf işinin sırası
  KI.aracSayfa = null;      // söz 37: «+» menüsünde «Tüm işler» açık mı
  KI.doldurulacak = '';     // söz 37: bir sonraki çizimde yazı alanına konacak örnek
  KI.sonGeriAl = null;      // söz 14
  KI.sesliSohbet = false;   // söz 13
  KI.sessizSay = 0;
  const EKRAN_EN_COK = 2500;
  const KARE_EN_GENIS = 1280;
  const GORSEL_SISTEM = 'Sen LifeOS\'un asistanı King\'sin. Kullanıcı sana ekranını ya da bir fotoğrafı gösteriyor. '
    + 'Türkçe, kısa ve net cevap ver (en çok beş cümle). Görüntüde görmediğin bir sayıyı ya da bilgiyi uydurma; '
    + 'okuyamadığın ya da emin olmadığın yeri açıkça söyle. Sağlıkla ilgili görüntülerde teşhis koyma, ilaç ya da doz önerme. '
    + 'Yardımcı olabileceğin sonraki adımı tek cümleyle öner.';
  KI.paylasim = null;       // söz 16: { tur:'ekran'|'kamera', kare() → { mime, data }, bitir() }
  /* Her açılış ve kapanış bir öncekini geçersiz kılar: izin beklenirken King
     kapanırsa ya da kipe iki kez basılırsa gelen akış sahipsiz kalmaz, durur. */
  KI.paylasimNo = 0;
  /* Kamera (2026-10-21): görüntü çoğu zaman masa, kâğıt, kitap; kişiye dair yorum yok. */
  const KAMERA_NOT = '\n\nGörüntü kullanıcının kamerasından geliyor (çoğu zaman masası, kâğıdı ya da kitabı). Kişinin yüzü, '
    + 'görünüşü, kıyafeti ya da duygusu hakkında yorum yapma; yalnız sorulan şeye ve masadaki işe odaklan.';
  const kameraMi = () => !!(KI.paylasim && KI.paylasim.tur === 'kamera');
  /* İnce yazı okuma («şu soruyu oku», «sayfayı oku») kamerada yavaş ama keskin görsel modele (qwen3-vl) gider. */
  const INCE_OKU = /(^|\s)(oku|okur musun|okuyabilir misin|okusana|okuyun|ne yazıyor|ne diyor)([\s.,!?]|$)/;
  const KAM = 'lifeos.king.kam';         // seçili kamera (deviceId); kimlik sayfanın adresine bağlı olduğundan taşınmaz
  KI.kamListe = [];                     // [{ id, ad }]
  function kamSecili(){ const v = ortam.depo.oku(KAM); return typeof v === 'string' ? v : ''; }
  async function kamTazele(){
    if(!ortam.kameraDestek() || typeof ortam.kameralar !== 'function') return [];
    const n = KI.kamListe.length;
    try{ KI.kamListe = (await ortam.kameralar()) || []; }catch(e){ KI.kamListe = []; }
    if(KI.acik && (KI.menu === 'menu' || KI.kamListe.length !== n)) KI.ciz(false);
    return KI.kamListe;
  }
  function kamSec(id){
    const v = String(id || '').trim();
    if(!v) ortam.depo.sil(KAM); else ortam.depo.yaz(KAM, v);
    if(kameraMi()){ KI.paylasimKapat(); return KI.kameraAc(); }   // açık kamera yenisine geçer
    KI.ciz(false);
    return true;
  }
  /* GÖZ (2026-10-21, kullanıcı: «ekranımı görürken arada bir görüntü alsın,
     ekranla ilgili soru sorsun; ama abartmasın»): paylaşım açıkken King ilk
     kez 3 dakika sonra, sonra en az 6 dakika arayla o anki kareye bakar.
     Ekran değişmediyse, son bir dakikada sen bir şey yaptıysan ya da King
     meşgulse bakmaz. Model söyleyecek değerli bir şey bulamazsa «PAS» der
     ve King susar. Kapatılabilir (lifeos.king.goz = false). */
  const GOZ = 'lifeos.king.goz';
  const GOZ_ILK = 3 * 60 * 1000, GOZ_ARA = 6 * 60 * 1000;
  const GOZ_SORU = 'Kullanıcının ekranına arada bir bakıyorsun; kendisi bir şey sormadı. Ekranda o an yaptığı işle ilgili, '
    + 'gerçekten işine yarayacak TEK kısa bir soru ya da öneri varsa yalnız onu yaz (en çok iki cümle, samimi, «sen» diye). '
    + 'Söylenecek değerli bir şey yoksa yalnız PAS yaz. Ekranda görmediğin hiçbir şeyi uydurma.';
  const GOZ_KAMERA = 'Kullanıcının masasındaki kameraya arada bir bakıyorsun; kendisi bir şey sormadı. Görüntüde ders çalışmayla '
    + 'ilgili bir şey (kâğıtta ya da kitapta bir soru, defter) varsa ve bir yerde takılmış görünüyorsa yardım teklif eden TEK kısa '
    + 'cümle yaz (en çok iki cümle, samimi, «sen» diye). Kişinin yüzü, görünüşü, kıyafeti, duygusu ya da odadaki biri hakkında '
    + 'hiçbir şey söyleme. Söylenecek değerli bir şey yoksa ya da emin değilsen yalnız PAS yaz. Görmediğin hiçbir şeyi uydurma.';
  KI.gozNo = 0; KI.gozSonEtkilesim = 0; KI.gozSonIz = ''; KI.gozVakit = 0;
  const gozAcik = () => ortam.depo.oku(GOZ) !== false;
  const TASIMA = 'lifeos.king';   // söz 18; animasyon.js TASINAN listesinde
  const CEVAP = 'lifeos.king.cevap';   // söz 19: 'oto' | 'ses' | 'yazi'; TASINAN'da
  const SES = 'lifeos.king.ses';       // söz 28: 'oto' | 'ema' | 'gemini' | 'piper' | 'cihaz'; TASINAN'da
  /* EMA (2026-10-21): King 2.0 A'nın yerel Türkçe sesi (HKM/core/ses.py «ema»); seçilebilir olmalıydı. */
  const SES_TERCIH = ['oto', 'ema', 'gemini', 'piper', 'cihaz'];
  const SES_AD = { oto:'Otomatik', ema:'EMA', gemini:'Gemini', piper:'Piper', cihaz:'Cihaz' };
  const SES_IP = { oto:'İnternet varsa Gemini, yoksa bilgisayardaki EMA, sonra Piper, en son cihazın sesi',
    ema:'Bilgisayardaki EMA: doğal Türkçe ses, ücretsiz; metin bilgisayardan çıkmaz',
    gemini:'Gemini’nin Türkçe sesi; metin Google’a gider', piper:'Bilgisayardaki Piper; metin bilgisayardan çıkmaz',
    cihaz:'Yalnız bu cihazın kendi sesi' };
  const SES_PARCA = 420;
  const ALGILA = 'lifeos.king.algila';   // soz 29: 'oto' | 'whisper' | 'ai' | 'tarayici'; TASINAN'da
  /* Gemma 4 (2026-10-21): ana yerel model sesi doğrudan anlar (HKM dinle.py kural 7). «Yapay zekâ» adı Gemini'yi
     saklıyordu; adı artık ne olduğunu söyler. */
  const ALGILA_TERCIH = ['oto', 'gemma', 'whisper', 'ai', 'tarayici'];
  const ALGILA_AD = { oto:'Otomatik', gemma:'Gemma 4', whisper:'Whisper', ai:'Gemini', tarayici:'Uygulama' };
  const ALGILA_IP = { oto:'Önce bilgisayardaki Gemma 4, uzun kayıtta ya da olmazsa Whisper, en son Gemini',
    gemma:'Gemma 4 sesi doğrudan anlar: hızlı, ücretsiz, ses bilgisayardan çıkmaz (uzun kayıtta Whisper)',
    whisper:'Yalnız Whisper: ücretsiz, ses bilgisayardan çıkmaz', ai:'Yalnız Gemini: internet ister, ücretli, ses Google’a gider',
    tarayici:'Uygulamanın (tarayıcının) kendi tanıması' };
  function algila(){ const v = ortam.depo.oku(ALGILA); return ALGILA_TERCIH.indexOf(v) > 0 ? v : 'oto'; }
  const MIK = 'lifeos.king.mik';         // soz 29: secili mikrofon (deviceId); TASINAN'da
  KI.mikListe = [];                     // [{ id, ad }]
  KI.mikDeniyor = null;                 // { dur:fn, iptal:fn } | null
  KI.mikNot = '';                       // son mikrofon denemesi sonucu
  function mikSecili(){ const v = ortam.depo.oku(MIK); return typeof v === 'string' ? v : ''; }
  function mikSec(id){
    const v = String(id || '').trim();
    if(!v) ortam.depo.sil(MIK); else ortam.depo.yaz(MIK, v);
    KI.mikNot = '';
    KI.ciz(false);
    return true;
  }
  async function mikTazele(){
    if(typeof ortam.mikrofonlar !== 'function') return [];
    try{ KI.mikListe = (await ortam.mikrofonlar()) || []; }catch(e){ KI.mikListe = []; }
    if(KI.acik && KI.menu === 'menu') KI.ciz(false);
    return KI.mikListe;
  }
  const DERIN = 'lifeos.king.derinlik';   // söz 31: 'oto' | 'hizli' | 'dengeli' | 'derin'; TASINAN'da
  const DERIN_TERCIH = ['oto', 'hizli', 'dengeli', 'derin'];
  const DERIN_AD = { oto:'Otomatik', hizli:'Hızlı', dengeli:'Dengeli', derin:'Derin' };
  const DERIN_IP = { oto:'Mesaja göre King seçer', hizli:'Kısa ve çabuk cevap',
    dengeli:'Öneri ve yorum, orta uzunlukta', derin:'Seçenekleri tartar, gerekçeli öneri; biraz daha uzun sürer' };
  KI.kipAcik = false;                   // başlıktaki kip menüsü açık mı (2026-10-19)
  function derinlik(){ const v = ortam.depo.oku(DERIN); return DERIN_TERCIH.indexOf(v) > 0 ? v : 'oto'; }
  function derinlikSec(v){
    if(DERIN_TERCIH.indexOf(v) < 0) return false;
    if(v === 'oto') ortam.depo.sil(DERIN); else ortam.depo.yaz(DERIN, v);
    KI.ciz(false);
    return true;
  }
  const HIZ = 'lifeos.king.hiz';       // okuma hizi; TASINAN'da
  const HIZLAR = [1, 1.15, 1.3, 1.5, 1.75];
  function hiz(){ const v = Number(ortam.depo.oku(HIZ)); return HIZLAR.indexOf(v) >= 0 ? v : 1; }               // sunucudan istenen bir parçanın en çok harfi
  const GUNLUK_EN_COK = 120, ARSIV_EN_COK = 30;
  KI.menu = null;            // söz 19: null | 'menu' | 'kayitlar' | { id }
  KI.silOnay = null;         // söz 19: silinmek üzere seçilen kayıt
  KI.silinen = null;         // söz 19: temizlenen sohbet («Geri getir»)
  KI.bekleyenYetki = null;   // söz 20: onay bekleyen orta/büyük eylem
  KI.bekleyenTanisma = null; // söz 22: { alan, soru }
  KI.disKisi = [];           // söz 22: öbür modüllerin kişi kayıtları [{ modul, kayitlar }]
  KI.kisiYeni = { alan:'sevgi', metin:'' };   // söz 22: paneldeki ekleme formu
  const TANISMA = 'lifeos.king.tanisma';
  const CIKARIM_KARAR = 'lifeos.king.cikarim';   // söz 23: { id:'dogru'|'kismen'|'yanlis' }
  const SORMA = 'lifeos.king.sorma';
  const USLUP = 'lifeos.king.uslup';           // söz 25: üslup sayacı
  KI.envanter = null;                          // söz 25: { i, cevaplar }           // söz 24: { ays:{ '*':true, uyku:false }, spi:{…} }
  const FOTO_EN_BUYUK = 15 * 1024 * 1024;
  KI.sesli = false;         // son istek sesle geldiyse cevap da sesle (söz 7)
  KI.dinleyen = null;       // çalışan tanıma oturumu
  KI.konusuyor = 0;         // okunmayı bekleyen parça sayısı

  /* ARKADAŞ (kullanıcı, 2026-10-28: «King'in arayüzünü bu temaya geçir;
     tatlı bir şey bizimle konuşsun: düşünürken elini arkaya atıp sağa sola
     yürüsün, uzun süre cevap vermezsek yazı yerinde uyusun»). Yazı alanının
     üstünde taçlı bir minik: hâlini King'in kendi durumundan okur (konuşuyor,
     cevap bekleniyor, mikrofon/yazı, boşta geçen süre); hiçbir şey yazmaz,
     ekran okuyucuya görünmez. Gövdesi gezen miniklerle aynıdır (minik.js). */
  const ARKADAS_UYKU = 45000;
  KI.arkadasSon = 0; KI.arkadasKonus = 0; KI.arkadasAralik = 0; let arkadasOnceki = ''; KI.arkadasPozu = 'dur'; KI.arkadasEsyasi = ''; KI.arkadasEsyaSon = 0;
  /* Konuşurken poz türlü (kullanıcı, 2026-10-28: «bazen konuşurken yürüsün,
     düşünsün, yatsın, ayaklarını aşağı uzatsın»); eşyayı cevap seçer: veri
     kartı grafik panosu, araştırma büyüteç, kayıt önizlemesi not defteri;
     yoksa ara sıra kahve ya da fikir ampulü. */
  /* «uzan» çıktı (King gözlemi 2026-10-28: ezilen gövdede gözler bozuluyordu). */
  function arkadasPoz(rnd){ const r = rnd(); return r < .45 ? 'dur' : r < .75 ? 'yuru' : 'otur'; }
  /* Konuşan sahne: yeni cevap yukarıdan aşağı satır satır belirir; ağız tam bu
     süre oynar (kelime başına 40 ms, 320–1400 ms). */
  function yazimSuresi(metin){ const n = String(metin || '').trim().split(/\s+/).filter(Boolean).length; return Math.max(320, Math.min(1400, n * 40)); }
  function arkadasEsya(m, rnd){
    if(m && ((m.kartlar && m.kartlar.length) || (m.satirlar && m.satirlar.length))) return 'grafik';
    if(m && m.arastirma) return 'buyutec';
    if(m && m.onizleme) return 'not';
    const r = rnd();
    return r < .2 ? 'ampul' : r < .4 ? 'kahve' : '';
  }
  function arkadasHal(o){
    if(o.konusuyor || o.akiyor) return 'konusuyor';   // model cevabı akarken de konuşur (2026-10-28)
    if(o.bekliyor) return 'dusunuyor';
    if(o.dinliyor || o.yaziyor) return 'dinliyor';
    if((o.bosta || 0) >= ARKADAS_UYKU) return 'uyuyor';
    return '';
  }
  function arkadasHtml(){
    const M = L.MINIK;
    if(!M || !M.ICERIK) return '';
    return '<div class="king__arkadas" aria-hidden="true"><div class="minik minik--king" data-tip="tac" data-bicim="yuvarlak" data-desen="karin" data-yon="sag">'
      + M.ICERIK + '</div></div>';
  }
  const ARKADAS_SINIF = { konusuyor:'is-konusuyor', dusunuyor:'is-dusunuyor', dinliyor:'is-farkinda', uyuyor:'is-uyuyor' };
  function arkadasGuncelle(){
    if(typeof document === 'undefined') return;
    const a = document.querySelector('.king__arkadas .minik');
    if(!a){ clearInterval(KI.arkadasAralik); KI.arkadasAralik = 0; return; }
    const g = document.querySelector('.king__girdi');
    const simdi = Date.now();
    const h = arkadasHal({ konusuyor:KI.konusuyor > 0 || simdi < KI.arkadasKonus, akiyor:KI.akis.some(m => m.akiyor), bekliyor:KI.akis.some(m => m.bekliyor),
      dinliyor:!!KI.dinleyen, yaziyor:!!(g && g.value), bosta:simdi - KI.arkadasSon });
    Object.keys(ARKADAS_SINIF).forEach(k => a.classList.toggle(ARKADAS_SINIF[k], k === h));
    const poz = h === 'konusuyor' ? KI.arkadasPozu : '';
    if(poz) a.dataset.poz = poz; else delete a.dataset.poz;
    a.classList.toggle('is-oturuyor', poz === 'otur');
    if(KI.arkadasEsyasi && (h === 'konusuyor' || simdi < KI.arkadasEsyaSon)) a.dataset.esya = KI.arkadasEsyasi; else delete a.dataset.esya;
    if(arkadasOnceki === 'uyuyor' && h !== 'uyuyor'){ a.classList.add('is-uyaniyor'); setTimeout(() => a.classList.remove('is-uyaniyor'), 1200); }
    a.querySelector('.minik__balon').textContent = h === 'dusunuyor' ? 'hımm…' : '';
    arkadasOnceki = h;
  }
  function arkadasUyandir(){ KI.arkadasSon = Date.now(); arkadasGuncelle(); }
  KI.sesNo = 0;             // söz 28: her yeni okuma eskisini geçersiz kılar
  KI.calan = null;          // çalan sunucu sesi ({ dur })
  KI.sonMotor = '';         // son okumayı kim yaptı: gemini | piper | cihaz
  KI.sonNot = '';           // söz 28: HKM'nin «neden bu motor» notu (X-Ses-Not)

  /* Ekran ve kamera akışı aynı biçime girer: { video, kare(), bitir() }. */
  async function videoKaynak(akis, bitince){
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.srcObject = akis;
    try{ await v.play(); }catch(e){ /* kare yine alınabilir */ }
    const iz = akis.getVideoTracks()[0];
    const bitti = () => bitince();
    if(iz) iz.addEventListener('ended', bitti);
    return {
      video:v,
      kare:() => kareCiz(v, v.videoWidth, v.videoHeight),
      /* Kamera ışığı (2026-10-21, kullanıcı: «kapattıktan sonra hâlâ yanıyor»): her iz durur, video bırakılır. */
      bitir:() => {
        if(iz) try{ iz.removeEventListener('ended', bitti); }catch(e){ /* yok */ }
        try{ akis.getTracks().forEach(t => t.stop()); }catch(e){ /* durmuş */ }
        try{ v.pause(); }catch(e){ /* durmuş */ }
        v.srcObject = null;
        try{ v.remove(); }catch(e){ /* DOM'da değil */ }
      },
    };
  }
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
      const puan = e.length + (KI.ayar && s.modul === KI.ayar.modul ? 0.5 : 0);   // eşitlikte bulunulan modül
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
    const veri = KI.ayar && KI.ayar.veri && typeof KI.ayar.veri.onizle === 'function' ? KI.ayar.veri
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

  /* ---------- söz 14: geri al ---------- */
  async function geriAlYap(){
    const g = KI.sonGeriAl;
    KI.sonGeriAl = null; KI.cipler = null;
    if(!g){ KI.soyle('Geri alınacak bir kayıt yok.'); return false; }
    try{ await g(); KI.soyle('Geri aldım.'); return true; }
    catch(e){ KI.soyle('Geri alamadım: ' + ((e && e.message) || 'bilinmeyen hata')); return false; }
  }

  async function ilet(){
    const x = KI.bekleyenIlet;
    KI.bekleyenIlet = null; KI.bekleyenGit = null; KI.cipler = null;
    if(!x) return;
    try{
      const r = await L.HESAP.gelenBirak(x.modul, x.metin);
      KI.soyle('İlettim. ' + ((r && r.mesaj) || ''));
    }catch(e){
      KI.soyle('İletemedim: ' + ((e && e.message) || 'sunucuya ulaşılamadı') + '. ' + MODUL_AD[x.modul] + '’yi açıp orada yazabilirsin.');
    }
  }

  const EVET = /^(evet|ekle|ekleyebilirsin|olur|tamam|kaydet|yaz|ok|okey|aç|açabilirsin|e|tabii|tabi|lütfen)( |$|[.,!])/;
  const HAYIR = /^(hayır|hayir|yok|vazgeç|gerek yok|ekleme|istemem|boşver|boş ver|açma|sonra)( |$|[.,!])/;

  /* Soru cümlesi mi (soru işareti ya da soru sözcüğü/eki)? Sözcük başı (^|\s). */
  const SORU = new RegExp('\\?|' + B + '(ne|neden|niye|nasıl|hangi|kaç|kim|nerede|nereye|niçin|m[ıiuü](?:s[ıiuü]n(?:[ıiuü]z)?|y[ıiuü][mz]|d[ıiuü]r)?)(?=$|\\s|[.,!])');
  function soruMu(t){ return SORU.test(kucuk(t)); }

  /* ------------------------------------------------------- HKM'deki King (söz 6) */

  function baglanti(){
    const b = KI.ayar && KI.ayar.hkm ? KI.ayar.hkm() : null;
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
  /* Söz 33: akan cevap. HKM satır satır NDJSON yollar: önce denetlenmiş
     cümleler («parca»), sonda tam cevap («son»). */
  async function akisOku(res, parca){
    const r = res.body.getReader();
    const dec = typeof TextDecoder === 'function' ? new TextDecoder() : null;
    let tampon = '', sonuc = null;
    const satir = s => {
      s = s.trim();
      if(!s) return;
      let o = null;
      try{ o = JSON.parse(s); }catch(e){ return; }
      if(o && o.t === 'parca' && typeof o.metin === 'string') parca(o.metin);
      else if(o && o.t === 'son') sonuc = o;
    };
    for(;;){
      const { value, done } = await r.read();
      if(done) break;
      tampon += typeof value === 'string' ? value : (dec ? dec.decode(value, { stream:true }) : String(value));
      let i;
      while((i = tampon.indexOf('\n')) >= 0){ satir(tampon.slice(0, i)); tampon = tampon.slice(i + 1); }
    }
    satir(tampon);
    return sonuc;
  }
  /* Söz 33: bu sohbetin başlangıcı (yerel saat). HKM ondan önceki satırları
     modele göndermez; kalıcı hafıza bundan etkilenmez. */
  const BAS = () => 'lifeos.king.bas.' + ((KI.ayar && KI.ayar.modul) || 'x');
  function yerelISO(d){
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function sohbetBas(){ const v = ortam.depo.oku(BAS()); return typeof v === 'string' ? v : ''; }
  function sohbetBasYaz(){ ortam.depo.yaz(BAS(), yerelISO(ortam.simdi())); }
  /* Doner: { ok:true, text, mode, akti } ya da { ok:false, neden:'baglanti'|'yok' }.
     `bek` verilirse cevap akarak istenir ve o balona yazılır. */
  async function merkezeSor(metin, bek, ek){
    const k = baglanti();
    if(!k) return { ok:false, neden:'baglanti' };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const d = derinlik();
    let okunan = '';
    /* Söz 31: Derin daha uzun sürebilir; bekleme iki katı. */
    const uzun = UZUN_ISTEK.test(metin) && UZUN_YAZ.test(metin);
    const t = ctrl ? setTimeout(() => ctrl.abort(), MERKEZ_ZAMAN_ASIMI * (uzun ? 3 : d === 'derin' ? 2 : 1)) : null;
    try{
      /* fetch bir nesnenin yöntemi olarak çağrılamaz («Illegal invocation»). */
      const f = ortam.fetch;
      /* Söz 38: modül araştırma profilini seçer (HKM arastir.py; yoksa Origin portu). */
      const govde = { text:String(metin).trim(), agent:'king', date:bugunISO(), modul:KI.ayar.modul };
      if(d !== 'oto') govde.derinlik = d;
      if(KI.tarz() !== 'samimi') govde.uslup = KI.tarz();
      if(sohbetBas()) govde.baslangic = sohbetBas();
      /* Söz 36: araç kataloğu yalnız sohbet isteğinde ve ikinci turda gider. */
      const A = ek && (ek.araclar || ek.arac_sonuclari) ? KI.ARAC() : null;
      if(A && A.kuruluMu()) govde.araclar = A.modelIcin();
      if(ek && ek.arac_sonuclari) govde.arac_sonuclari = ek.arac_sonuclari;
      const istek = yol => f(k.url + yol, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify(govde),
        signal:ctrl ? ctrl.signal : undefined,
      });
      let res = await istek(bek ? '/api/chat/akis' : '/api/chat');
      if(bek && (res.status === 404 || res.status === 405)) res = await istek('/api/chat');   // eski HKM
      const tur = res.headers && res.headers.get ? String(res.headers.get('Content-Type') || '') : '';
      let g = null, akti = false;
      if(res.status === 200 && /ndjson/.test(tur) && res.body && typeof res.body.getReader === 'function'){
        g = await akisOku(res, p => {
          if(!bek) return;
          akti = true;
          bek.bekliyor = false; bek.akiyor = true; bek.metin += p;
          /* K3: sesle konuşurken ilk cümle cevap bitmeden okunur. */
          if(KI.sesleMi() && p.trim()){ KI.seslendir(p, okunan ? 'ek' : 'acik'); okunan += p; }
          KI.ciz(false);
        });
      }else{
        try{ g = await res.json(); }catch(e){ g = null; }
      }
      if(res.status === 200 && g && g.ok !== false && g.mode === 'arac' && Array.isArray(g.cagrilar) && g.cagrilar.length){
        return { ok:true, arac:g.cagrilar, reddedilen:g.reddedilen || [], text:String(g.text || ''), mode:'arac', akti };
      }
      if(res.status === 200 && g && g.ok !== false && typeof g.text === 'string' && g.text.trim()){
        const ars = g.mode === 'arastirma' ? KI.arastirmaVeri(g.arastirma) : null;
        if(ars) return { ok:true, text:g.text.trim(), mode:g.mode, akti, arastirma:ars };
        const k2 = KI.k2Oku(g);
        let text = g.text.trim();
        if(k2 && k2.not && text.slice(-k2.not.length) === k2.not) text = text.slice(0, -k2.not.length).trim() || text;
        const sonuc = { ok:true, text, mode:g.mode || '', akti, arastirma:null, okunan, k2,
          eylemler:Array.isArray(g.eylemler) ? g.eylemler : null };
        okunan = '';                 // kalanını cevabı yazan soyle okur
        return sonuc;
      }
      return { ok:false, neden:res.status === 200 ? 'yok' : 'baglanti' };
    }catch(e){
      return { ok:false, neden:'baglanti' };
    }finally{
      if(t) clearTimeout(t);
      /* Okunmaya başlanmış ama düz cevapla bitmeyen akış: kuyruk kapanır, King susunca dinler. */
      if(okunan) KI.seslendir('', 'son');
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
    if(!KI.ayar || !h) return false;
    if(h.modul === KI.ayar.modul){
      KI.kucult();                                    // söz 9: kapanmaz, küçülür
      try{ KI.ayar.git(h.route, h.ek || {}); }catch(e){ console.error('King: git', e); }
      KI.ekranDegisti();
      return true;
    }
    const url = ortam.adres(h.modul);
    if(!url){
      KI.soyle(MODUL_AD[h.modul] + ' bu sayfadan açılamıyor; LifeOS panelinden aç.');
      return false;
    }
    const A = L && L.ANIMASYON;
    if(KI.acik && A && typeof A.tasimaEkle === 'function'){
      KI.tasimaYaz(null, Object.assign({ route:h.route, sekme:(h.ek && h.ek.sekme) || null }, h.ek && h.ek.is != null ? { is:h.ek.is } : {}));
      ortam.git(A.tasimaEkle(url));
      return true;
    }
    ortam.git(url + '#king=' + h.route + (h.ek && h.ek.sekme ? ':' + h.ek.sekme : ''));
    return true;
  }

  function ozetSatirlari(){
    let s = [];
    try{ s = (KI.ayar && KI.ayar.ozet ? KI.ayar.ozet() : []) || []; }catch(e){ s = []; }
    return (Array.isArray(s) ? s : [s]).filter(Boolean).map(String);
  }

  Object.assign(KI, { L, MODUL_AD, SAYFALAR, HAZIR, NIYET, ortam, YAN, yanDar, yanDarSec, yanDugme, yanDugmeHtml, EKRAN_EN_COK, GORSEL_SISTEM, KAMERA_NOT, kameraMi, INCE_OKU, KAM, kamSecili, kamTazele, kamSec, GOZ, GOZ_ILK, GOZ_ARA, GOZ_SORU, GOZ_KAMERA, gozAcik, TASIMA, CEVAP, SES, SES_TERCIH, SES_AD, SES_IP, SES_PARCA, ALGILA, ALGILA_TERCIH, ALGILA_AD, ALGILA_IP, algila, MIK, mikSecili, mikSec, mikTazele, DERIN, DERIN_TERCIH, DERIN_AD, DERIN_IP, derinlik, derinlikSec, HIZ, HIZLAR, hiz, GUNLUK_EN_COK, ARSIV_EN_COK, TANISMA, CIKARIM_KARAR, SORMA, USLUP, FOTO_EN_BUYUK, ARKADAS_UYKU, arkadasPoz, yazimSuresi, arkadasEsya, arkadasHal, arkadasHtml, arkadasGuncelle, arkadasUyandir, videoKaynak, kac, kucuk, sayfaBul, yorumla, sohbet, veriGibi, geriAlYap, ilet, EVET, HAYIR, soruMu, baglanti, bugunISO, BAS, sohbetBas, sohbetBasYaz, merkezeSor, gecerliRota, git, ozetSatirlari });
})();
