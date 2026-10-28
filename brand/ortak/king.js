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
  /* Kenar çubuğunun düğmesi çubuğun İÇİNDE (2026-10-19, kullanıcı: «King'in
     yanında olmasın; kapatılınca orada bir çıkıntı kalsın»): açıkken
     «Yeni sohbet»in yanında kapat, kapalıyken pencerenin sol kenarında
     ince bir çıkıntı açar. İkisi aynı işi yapar, aynı durumu söyler. */
  function yanDugmeHtml(sinif){
    const gorunur = ortam.genis() ? !yanDar() : yanAcik;
    const ad = gorunur ? 'Kenar çubuğunu kapat' : 'Sohbet geçmişini aç';
    const yol = sinif === 'king__cikinti' ? '<path d="M10 7l5 5-5 5"/>' : '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>';
    return '<button type="button" class="' + sinif + '" data-king="yan" aria-expanded="' + (gorunur ? 'true' : 'false')
      + '" aria-label="' + ad + '" title="' + ad + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + yol + '</svg></button>';
  }
  let aktifKayit = null;     // söz 26: geçmişten açılan sohbetin kimliği
  let aracAcik = false;      // söz 27: «+» menüsü açık mı
  let klasorYeni = false;    // söz 27: yeni klasör adı soruluyor mu
  let tasinan = null;        // söz 27: klasöre taşınacak sohbetin kimliği
  let adlandirilan = null;   // söz 27: yeniden adlandırılan sohbetin kimliği
  let bekleyenIlet = null;   // { modul, metin } öteki modüle iletilecek satır (söz 10)
  let mini = false;          // küçük kutu (söz 9)
  let bekleyenFoto = null;   // söz 11
  let fotoHedef = null;      // söz 37: «Tüm işler»den seçilen fotoğraf işinin sırası
  let aracSayfa = null;      // söz 37: «+» menüsünde «Tüm işler» açık mı
  let doldurulacak = '';     // söz 37: bir sonraki çizimde yazı alanına konacak örnek
  let sonGeriAl = null;      // söz 14
  let sesliSohbet = false;   // söz 13
  let sessizSay = 0;
  const EKRAN_EN_COK = 2500;
  const KARE_EN_GENIS = 1280;
  const GORSEL_SISTEM = 'Sen LifeOS\'un asistanı King\'sin. Kullanıcı sana ekranını ya da bir fotoğrafı gösteriyor. '
    + 'Türkçe, kısa ve net cevap ver (en çok beş cümle). Görüntüde görmediğin bir sayıyı ya da bilgiyi uydurma; '
    + 'okuyamadığın ya da emin olmadığın yeri açıkça söyle. Sağlıkla ilgili görüntülerde teşhis koyma, ilaç ya da doz önerme. '
    + 'Yardımcı olabileceğin sonraki adımı tek cümleyle öner.';
  let paylasim = null;       // söz 16: { tur:'ekran'|'kamera', kare() → { mime, data }, bitir() }
  /* Her açılış ve kapanış bir öncekini geçersiz kılar: izin beklenirken King
     kapanırsa ya da kipe iki kez basılırsa gelen akış sahipsiz kalmaz, durur. */
  let paylasimNo = 0;
  /* Kamera (2026-10-21): görüntü çoğu zaman masa, kâğıt, kitap; kişiye dair yorum yok. */
  const KAMERA_NOT = '\n\nGörüntü kullanıcının kamerasından geliyor (çoğu zaman masası, kâğıdı ya da kitabı). Kişinin yüzü, '
    + 'görünüşü, kıyafeti ya da duygusu hakkında yorum yapma; yalnız sorulan şeye ve masadaki işe odaklan.';
  const kameraMi = () => !!(paylasim && paylasim.tur === 'kamera');
  /* İnce yazı okuma («şu soruyu oku», «sayfayı oku») kamerada yavaş ama keskin görsel modele (qwen3-vl) gider. */
  const INCE_OKU = /(^|\s)(oku|okur musun|okuyabilir misin|okusana|okuyun|ne yazıyor|ne diyor)([\s.,!?]|$)/;
  const KAM = 'lifeos.king.kam';         // seçili kamera (deviceId); kimlik sayfanın adresine bağlı olduğundan taşınmaz
  let kamListe = [];                     // [{ id, ad }]
  function kamSecili(){ const v = ortam.depo.oku(KAM); return typeof v === 'string' ? v : ''; }
  async function kamTazele(){
    if(!ortam.kameraDestek() || typeof ortam.kameralar !== 'function') return [];
    const n = kamListe.length;
    try{ kamListe = (await ortam.kameralar()) || []; }catch(e){ kamListe = []; }
    if(acik && (menu === 'menu' || kamListe.length !== n)) ciz(false);
    return kamListe;
  }
  function kamSec(id){
    const v = String(id || '').trim();
    if(!v) ortam.depo.sil(KAM); else ortam.depo.yaz(KAM, v);
    if(kameraMi()){ paylasimKapat(); return kameraAc(); }   // açık kamera yenisine geçer
    ciz(false);
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
  let gozNo = 0, gozSonEtkilesim = 0, gozSonIz = '', gozVakit = 0;
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
  let kipAcik = false;                   // başlıktaki kip menüsü açık mı (2026-10-19)
  function derinlik(){ const v = ortam.depo.oku(DERIN); return DERIN_TERCIH.indexOf(v) > 0 ? v : 'oto'; }
  function derinlikSec(v){
    if(DERIN_TERCIH.indexOf(v) < 0) return false;
    if(v === 'oto') ortam.depo.sil(DERIN); else ortam.depo.yaz(DERIN, v);
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

  /* ARKADAŞ (kullanıcı, 2026-10-28: «King'in arayüzünü bu temaya geçir;
     tatlı bir şey bizimle konuşsun: düşünürken elini arkaya atıp sağa sola
     yürüsün, uzun süre cevap vermezsek yazı yerinde uyusun»). Yazı alanının
     üstünde taçlı bir minik: hâlini King'in kendi durumundan okur (konuşuyor,
     cevap bekleniyor, mikrofon/yazı, boşta geçen süre); hiçbir şey yazmaz,
     ekran okuyucuya görünmez. Gövdesi gezen miniklerle aynıdır (minik.js). */
  const ARKADAS_UYKU = 45000;
  let arkadasSon = 0, arkadasKonus = 0, arkadasAralik = 0, arkadasOnceki = '';
  function arkadasHal(o){
    if(o.konusuyor) return 'konusuyor';
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
    if(!a){ clearInterval(arkadasAralik); arkadasAralik = 0; return; }
    const g = document.querySelector('.king__girdi');
    const simdi = Date.now();
    const h = arkadasHal({ konusuyor:konusuyor > 0 || simdi < arkadasKonus, bekliyor:akis.some(m => m.bekliyor),
      dinliyor:!!dinleyen, yaziyor:!!(g && g.value), bosta:simdi - arkadasSon });
    Object.keys(ARKADAS_SINIF).forEach(k => a.classList.toggle(ARKADAS_SINIF[k], k === h));
    if(arkadasOnceki === 'uyuyor' && h !== 'uyuyor'){ a.classList.add('is-uyaniyor'); setTimeout(() => a.classList.remove('is-uyaniyor'), 1200); }
    a.querySelector('.minik__balon').textContent = h === 'dusunuyor' ? 'hımm…' : '';
    arkadasOnceki = h;
  }
  function arkadasUyandir(){ arkadasSon = Date.now(); arkadasGuncelle(); }
  let sesNo = 0;             // söz 28: her yeni okuma eskisini geçersiz kılar
  let calan = null;          // çalan sunucu sesi ({ dur })
  let sonMotor = '';         // son okumayı kim yaptı: gemini | piper | cihaz
  let sonNot = '';           // söz 28: HKM'nin «neden bu motor» notu (X-Ses-Not)

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
    const fotoUrl = ortam.nesneUrl(file);
    akis.push({ kim:'sen', foto:fotoUrl, metin:'(fotoğraf)' });
    gorselSakla(fotoUrl);
    const l = fotoIsleri();
    /* Söz 37: iş önceden seçildiyse («Tüm işler») doğrudan o işe. */
    if(fotoHedef != null && l[fotoHedef]){ fotoIsle(fotoHedef, file); return true; }
    const gorur = gorebilir();
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
  /* G: PDF — metnini bilgisayardaki Merkez çıkarır (HKM/core/belge.py, model
     yok; /api/king/belge), King özetler. Belge saklanmaz; Merkez yoksa söylenir. */
  const PDF_EN_BUYUK = 8 * 1024 * 1024, PDF_METIN = 6000;
  async function pdfAl(file){
    if(!acik || !file) return false;
    if(!/pdf$/i.test(file.type || '') && !/\.pdf$/i.test(file.name || '')){ soyle('Bu bir PDF değil; PDF dosyası seç.'); return false; }
    const ad = String(file.name || 'belge.pdf').slice(0, 120);
    akis.push({ kim:'sen', metin:'(PDF) ' + ad });
    if(file.size > PDF_EN_BUYUK){ soyle('PDF çok büyük (en çok 8 MB).'); return false; }
    const k = baglanti();
    if(!k){ soyle('PDF’in metnini bilgisayardaki Merkez çıkarır; Merkez bağlı değil. Bağlanınca yeniden dene.'); return false; }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek); ciz(false);
    let g = null, durum = 0;
    try{
      const veri = await ortam.dosyaB64(file);
      const res = await ortam.fetch(k.url + '/api/king/belge', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token }, body:JSON.stringify({ ad, veri }) });
      durum = res.status;
      try{ g = await res.json(); }catch(e){ g = null; }
    }catch(e){ g = null; }
    if(!g || !g.ok){
      akis = akis.filter(m => m !== bek);
      soyle(durum === 404 ? 'Merkez’in bu sürümü PDF okumuyor; güncelleyince okurum.' : 'PDF okunamadı: ' + String((g && g.note) || 'Merkez cevap vermedi').replace(/[.]$/, '') + '.');
      return false;
    }
    const neden = ['Metni bilgisayardaki Merkez çıkardı (model yok); özeti King yazdı.' + (g.kesildi || String(g.metin || '').length > PDF_METIN ? ' Belge uzundu; baş kısmı okundu.' : '')];
    const r = await merkezeSor('Kullanıcı bir PDF verdi: «' + ad + '»' + (g.sayfa ? ' (' + g.sayfa + ' sayfa)' : '') + '. Metni aşağıda. Türkçe, kısa özetle '
      + '(en çok beş madde) ve LifeOS’ta işine yarayacak sonraki adımı tek cümleyle öner; metinde olmayan sayıyı yazma.\n\n' + String(g.metin || '').slice(0, PDF_METIN));
    akis = akis.filter(m => m !== bek);
    kaynakMetin = { ad, metin:String(g.metin || '') };
    cipler = [{ ad:'Derse çevir', is:'derse-cevir' }];
    soyle(r.ok ? r.text : 'PDF’in metnini okudum (' + (Number(g.kelime) || 0) + ' kelime) ama Merkez özetleyemedi.', null, null, null, { neden });
    return true;
  }
  /* Söz 37: işe görüntü okuma yardımı gider (Merkez'in görsel modeli); iş
     metin döndürürse söylenir (sayfa açtı), { metin, satirlar, arac }
     döndürürse aracın önizlemesi onay kartıyla gösterilir. */
  async function fotoIsle(i, dosya){
    const x = fotoIsleri()[i], f = dosya || bekleyenFoto;
    bekleyenFoto = null; cipler = null; fotoHedef = null;
    if(!x || !f) return;
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek); ciz(false);
    let r = null;
    try{ r = await x.is(f, { gorsel:(soru, yetenek) => gorselOku(f, soru, yetenek), kamera:!!dosya }); }
    catch(e){ akis = akis.filter(m => m !== bek); soyle('Fotoğraf işlenemedi: ' + ((e && e.message) || 'bilinmeyen hata')); return; }
    akis = akis.filter(m => m !== bek);
    if(!r || typeof r !== 'object'){ kucult(); soyle((r && String(r)) || 'Tamam, fotoğrafı yerine koydum.'); return; }
    const on = String(r.metin || '').trim();
    if(r.arac && ARAC()){
      const o = await ARAC().onizle(r.arac.ad, r.arac.param, { metin:'' });
      if(o.ok){ aracKart(o, on, r.satirlar); return; }
      soyle((on ? on + ' ' : '') + String(o.hata || 'Önizlenemedi').replace(/^./, c => c.toLocaleUpperCase('tr-TR')).replace(/[.]?$/, '.'), r.satirlar || null);
      return;
    }
    soyle(on || 'Tamam.', r.satirlar || null);
  }
  /* Görüntü okuma (sessiz): Merkez'in görsel kademesi, yoksa modülün zinciri. */
  async function gorselOku(f, soru, yetenek){
    let resim;
    try{ resim = await ortam.dosyaKare(f); }catch(e){ return { ok:false, note:'görüntü okunamadı' }; }
    const k = baglanti(), z = gorselZincir();
    if(k){ const r = await merkezGorsel(k, soru, resim, yetenek || 'gorsel'); if(r.ok || !z.length) return r; }
    if(!z.length) return { ok:false, note:'Merkez bağlı değil' };
    try{
      const r = await modelKatmani().complete(z, { system:GORSEL_SISTEM, temperature:0.1, maxTokens:900, messages:[{ role:'user', text:String(soru), images:[resim] }] });
      const t = String((r && r.text) || '').trim();
      return t ? { ok:true, text:t } : { ok:false, note:'model boş döndü' };
    }catch(e){ return { ok:false, note:'model yanıt vermedi' }; }
  }
  /* Söz 37: kamera kipinde fotoğraf işi tek düğmeyle — o anki kare dosya olur. */
  function kareDosya(k, ad){
    const b = atob(String(k.data || ''));
    const u = new Uint8Array(b.length);
    for(let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return new File([u], (ad || 'kare') + '.jpg', { type:k.mime || 'image/jpeg' });
  }
  async function kameraIs(i){
    const x = fotoIsleri()[i];
    if(!x || !kameraMi()) return null;
    let kare;
    try{ kare = paylasim.kare(); }catch(e){ soyle('Kameranın karesi alınamadı: ' + ((e && e.message) || 'bilinmeyen hata')); return null; }
    akis.push({ kim:'sen', metin:'(kameradan) ' + x.ad });
    return fotoIsle(i, kareDosya(kare, x.id));
  }
  /* «Tüm işler»den foto işi seçildi: kamerayla ya da fotoğrafla. */
  function fotoIsBaslat(x){
    const i = fotoIsleri().findIndex(f => f.id === x.id);
    if(i < 0){ soyle(x.ad + ' şu an bu sayfada yapılamıyor.'); return; }
    fotoHedef = i; bekleyen = null; bekleyenGit = null; bekleyenIlet = null;
    if(kameraMi()){ cipler = [{ ad:x.ad, is:'kam-is:' + i }, { ad:'Vazgeç', is:'vazgec' }]; soyle(x.ad + ': kamerayı tut, hazır olunca düğmeye dokun.'); return; }
    cipler = (ortam.kameraDestek() ? [{ ad:'Kamerayla', is:'is-kamera' }] : []).concat([{ ad:'Fotoğraf seç', is:'foto-sec' }, { ad:'Vazgeç', is:'vazgec' }]);
    soyle(x.ad + (x.ne ? ' (' + x.ne + ')' : '') + '. Kamerayla mı, fotoğrafla mı?');
  }
  async function isKamera(){
    const i = fotoHedef, x = fotoIsleri()[i];
    cipler = null;
    if(!x) return;
    if(!kameraMi()) await kameraAc();
    if(!kameraMi()) return;
    fotoHedef = i;
    cipler = [{ ad:x.ad, is:'kam-is:' + i }, { ad:'Vazgeç', is:'vazgec' }];
    soyle('Kamera açık. ' + x.ad + ' için hazır olunca düğmeye dokun.');
  }
  /* Söz 37: «Tüm işler»den bir iş. Başka modülün işi o modülde açılır. */
  function isSec(n){
    const A = ARAC(), x = A && A.ISLER ? A.ISLER[n] : null;
    if(!x || !ayar) return false;
    if(x.modul !== 'king' && x.modul !== ayar.modul){
      soyle(x.ad + ' ' + MODUL_AD[x.modul] + '’nin işi; oraya geçiyorum.');
      ortam.zamanla(() => git({ modul:x.modul, route:x.route || 'today', ek:{ is:n } }), 650);
      return true;
    }
    if(x.tur === 'foto'){ fotoIsBaslat(x); return true; }
    doldurulacak = String(x.ornek || '');
    ciz(true);
    return true;
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
  /* GÖRÜNTÜ MERKEZ'DE (2026-10-21, kullanıcı: «hâlâ Gemini istiyor»): model
     ayarları yalnız HKM'de durur; modülün kendi zinciri boştur. Merkez'e
     bağlıyken fotoğraf ve ekran karesi HKM'nin modül görsel kademesine
     (<modül>.gorsel, ör. yerel qwen3-vl) gider: /api/ofis/cevap, yetenek
     «gorsel». Bağlı değilse modülde eski bir zincir varsa o denenir. */
  function gorebilir(){ return !!baglanti() || gorselZincir().length > 0; }
  const GORSEL_YOK = 'Görüntüyü yorumlamak için Merkez’e (HKM) bağlı olmam gerekiyor. Merkez açıkken fotoğrafını ve '
    + 'ekranını bilgisayardaki görsel modelle okurum; görüntü internete çıkmaz.';
  const GORSEL_ZAMAN = 120000;   // görsel model ilk istekte belleğe yüklenir
  async function merkezGorsel(k, soru, resim, yetenek, tekrar){
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), GORSEL_ZAMAN) : null;
    try{
      const f = ortam.fetch;
      const res = await f(k.url + '/api/ofis/cevap', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ modul:ayar.modul, yetenek:yetenek || 'gorsel',
          sistem:GORSEL_SISTEM + (kameraMi() ? KAMERA_NOT : '') + (kisiOzeti() ? '\n\n' + kisiOzeti() : ''),
          mesajlar:[{ role:'user', text:String(soru || 'Bu görüntüde ne var?') }], gorseller:[resim] }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      /* Eski jeton (401, sahada 2026-10-21): modül Merkez'e yeniden bağlanır, bir kez daha denenir. */
      if(res.status === 401 && !tekrar){
        const b = ayar.hkm ? ayar.hkm() : null;
        if(b && typeof b.save === 'function' && typeof b.kendiBaglan === 'function'){
          try{ await b.save({ lastStatus:401 }); const e = await b.kendiBaglan(); const k2 = baglanti();
            if(e && e.ok && k2) return merkezGorsel(k2, soru, resim, yetenek, true); }catch(e){ /* bağlanamadı */ }
        }
      }
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      if(res.status === 200 && g && g.ok && String(g.text || '').trim()) return { ok:true, text:String(g.text).trim() };
      return { ok:false, note:(g && g.note) || 'Merkez görüntüye cevap vermedi.' };
    }catch(e){
      return { ok:false, note:e && e.name === 'AbortError' ? 'Görsel model zamanında cevap vermedi.' : 'Merkez’e ulaşılamadı.' };
    }finally{
      if(t) clearTimeout(t);
    }
  }
  async function gorselCevap(soru, resim, yetenek){
    const zincir = gorselZincir();
    const k = baglanti();
    if(!k && !zincir.length){ soyle(GORSEL_YOK); return null; }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek); ciz(false);
    if(k){
      const r = await merkezGorsel(k, soru, resim, yetenek);
      if(r.ok || !zincir.length){
        akis = akis.filter(m => m !== bek);
        soyle(r.ok ? r.text : 'Görüntüyü yorumlayamadım: ' + r.note);
        return r.ok ? r : null;
      }
    }
    try{
      const M = modelKatmani();
      const r = await M.complete(zincir, { system:GORSEL_SISTEM + (kameraMi() ? KAMERA_NOT : '') + (kisiOzeti() ? '\n\n' + kisiOzeti() : ''), temperature:0.3, maxTokens:700,
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
    if(paylasim && !kameraMi()){ paylasimBitir(); return false; }
    if(paylasim) paylasimKapat();                // ekran ile kamera aynı anda açık olmaz
    if(!ortam.ekranDestek()){
      soyle('Bu cihazda tarayıcı ekran paylaşamıyor (telefonda tarayıcılar buna izin vermiyor). Ekran görüntüsü alıp '
        + 'fotoğraf olarak gönderirsen ne gördüğümü söylerim.');
      return false;
    }
    if(!gorebilir()){ soyle(GORSEL_YOK); return false; }
    const no = ++paylasimNo;
    try{
      const p = await ortam.ekranBaslat(() => { if(paylasim && paylasim === p){ paylasimKapat(); soyle('Ekran paylaşımı bitti.'); } });
      if(no !== paylasimNo || !acik){ try{ p.bitir(); }catch(e){ /* durmuş */ } return false; }   // bu arada kapandı
      p.tur = 'ekran';
      paylasim = p;
    }catch(e){
      if(no !== paylasimNo) return false;
      paylasim = null;
      soyle(e && e.name === 'NotAllowedError' ? 'Ekran paylaşımı iptal edildi.' : 'Ekran paylaşılamadı: ' + ((e && e.message) || 'bilinmeyen hata'));
      return false;
    }
    gozSonIz = '';
    gozKur(GOZ_ILK);
    soyle('Ekranını görüyorum. Ne sorarsan o anki ekranı yorumlarım; ' + (gozAcik() ? 'arada bir de kendim bakıp '
      + 'işine yarayacak bir şey görürsem söylerim.' : 'görüntü yalnız sorduğunda yapay zekâya gider, saklanmaz.'));
    return true;
  }
  async function kameraAc(){
    if(kameraMi()){ paylasimBitir(); return false; }
    if(paylasim) paylasimKapat();
    if(!ortam.kameraDestek()){ soyle('Bu cihazda kameraya ulaşılamıyor.'); return false; }
    /* Söz 37: modülün fotoğraf işi varsa (barkod cihazda okunur) Merkez'siz de açılır. */
    if(!gorebilir() && !fotoIsleri().length){ soyle(GORSEL_YOK); return false; }
    const no = ++paylasimNo;
    try{
      const p = await ortam.kameraBaslat(() => { if(paylasim && paylasim === p){ paylasimKapat(); soyle('Kamera kapandı.'); } }, kamSecili());
      if(no !== paylasimNo || !acik){ try{ p.bitir(); }catch(e){ /* durmuş */ } return false; }   // bu arada kapandı
      p.tur = 'kamera';
      paylasim = p;
    }catch(e){
      if(no !== paylasimNo) return false;
      paylasim = null;
      const ad = e && e.name;
      soyle(ad === 'NotAllowedError' ? 'Kameraya izin verilmedi.' : ad === 'NotFoundError' || ad === 'OverconstrainedError'
        ? 'Kamera bulunamadı; takılı olduğundan emin ol.' : ad === 'NotReadableError' ? 'Kamera başka bir uygulamada açık görünüyor.'
        : 'Kamera açılamadı: ' + ((e && e.message) || 'bilinmeyen hata'));
      return false;
    }
    kamTazele();                                 // izinden sonra kameraların adları gelir
    gozSonIz = '';
    gozKur(GOZ_ILK);
    soyle('Kamerayı görüyorum. Masandaki kâğıdı ya da kitabı gösterip sorabilirsin; ' + (gozAcik() ? 'arada bir de kendim bakıp '
      + 'takıldığın bir yer görürsem yardım teklif ederim.' : 'görüntü yalnız sorduğunda okunur.') + ' Görüntü saklanmaz, bilgisayardan çıkmaz.');
    return true;
  }
  let gozZaman = null;
  function gozKur(ms){
    gozDurdur();
    const no = gozNo; gozVakit = ortam.simdi().getTime() + ms;
    gozZaman = ortam.zamanla(() => { gozZaman = null; gozBak(no); }, ms);
  }
  function gozDurdur(){
    gozNo++;
    if(gozZaman != null){ try{ ortam.zamanIptal(gozZaman); }catch(e){ /* yok */ } gozZaman = null; }
  }
  function gozIz(v){ const s = String(v || ''); let h = 0; for(let i = 0; i < s.length; i += 97) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; }
  async function gozBak(no){
    /* Vakti gelmeden çağrıldıysa (anında çalışan zamanlayıcı) hiçbir şey yapılmaz: döngü kendini beslemez. */
    if(no !== gozNo || !paylasim || !acik || ortam.simdi().getTime() < gozVakit - 1000) return;
    const sonra = () => { if(no === gozNo && paylasim) gozKur(GOZ_ARA); };
    const k = baglanti();
    const mesgul = !!dinleyen || konusuyor > 0 || akis.some(m => m.bekliyor) || ortam.simdi().getTime() - gozSonEtkilesim < 60000;
    if(!gozAcik() || mesgul || !k){ sonra(); return; }
    let kare = null;
    try{ kare = paylasim.kare(); }catch(e){ sonra(); return; }
    const iz = gozIz(kare && kare.data);
    if(iz === gozSonIz){ sonra(); return; }      // ekran değişmemiş: rahatsız etme
    gozSonIz = iz;
    const r = await merkezGorsel(k, kameraMi() ? GOZ_KAMERA : GOZ_SORU, kare, 'ekran');
    if(no !== gozNo || !paylasim) return;
    const cevap = r.ok ? String(r.text || '').trim() : '';
    if(cevap && !/^PAS\b/i.test(cevap) && cevap.length <= 320) soyle(cevap);
    sonra();
  }
  function gozSec(ac){ if(ac) ortam.depo.sil(GOZ); else ortam.depo.yaz(GOZ, false); ciz(false); }
  function paylasimKapat(){
    const p = paylasim;
    paylasim = null;
    paylasimNo++;                                // bekleyen açılış da geçersiz
    gozDurdur();
    if(p) try{ p.bitir(); }catch(e){ /* durmuş */ }
    return p;
  }
  function paylasimBitir(){
    const p = paylasimKapat();
    if(acik) soyle(p && p.tur === 'kamera' ? 'Kamerayı kapattım.' : 'Ekran paylaşımını durdurdum.');
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
    kesiciKapat();
    if(!sesliSohbet || !acik || dinleyen || konusuyor || akis.some(m => m.bekliyor || m.akiyor)) return;
    if(sesKuyruk && sesKuyruk.no === sesNo && !sesKuyruk.kapali) return;   // akan cevap sürüyor
    dinle();
  }
  function sesliSohbetAc(){
    if(!konusabilir()){ soyle('Bu tarayıcı konuşmayı tanımıyor; yazarak devam edebilirsin.'); return false; }
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
  const BAS = () => 'lifeos.king.bas.' + ((ayar && ayar.modul) || 'x');
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
      const govde = { text:String(metin).trim(), agent:'king', date:bugunISO(), modul:ayar.modul };
      if(d !== 'oto') govde.derinlik = d;
      if(tarz() !== 'samimi') govde.uslup = tarz();
      if(sohbetBas()) govde.baslangic = sohbetBas();
      /* Söz 36: araç kataloğu yalnız sohbet isteğinde ve ikinci turda gider. */
      const A = ek && (ek.araclar || ek.arac_sonuclari) ? ARAC() : null;
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
          if(sesleMi() && p.trim()){ seslendir(p, okunan ? 'ek' : 'acik'); okunan += p; }
          ciz(false);
        });
      }else{
        try{ g = await res.json(); }catch(e){ g = null; }
      }
      if(res.status === 200 && g && g.ok !== false && g.mode === 'arac' && Array.isArray(g.cagrilar) && g.cagrilar.length){
        return { ok:true, arac:g.cagrilar, reddedilen:g.reddedilen || [], text:String(g.text || ''), mode:'arac', akti };
      }
      if(res.status === 200 && g && g.ok !== false && typeof g.text === 'string' && g.text.trim()){
        const ars = g.mode === 'arastirma' ? arastirmaVeri(g.arastirma) : null;
        if(ars) return { ok:true, text:g.text.trim(), mode:g.mode, akti, arastirma:ars };
        const k2 = k2Oku(g);
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
      if(okunan) seslendir('', 'son');
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
      tasimaYaz(null, Object.assign({ route:h.route, sekme:(h.ek && h.ek.sekme) || null }, h.ek && h.ek.is != null ? { is:h.ek.is } : {}));
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
    if(uyanik || uyanAralik) uyanKontrol();      // K3: King konuşur ya da dinlerken uyanma dinleyicisi susar
    if(typeof document === 'undefined') return;
    arkadasGuncelle();
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
    kesiciKapat();
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
  /* K3: akan ses ucu (HKM /api/ses/akis). Eski HKM'de yoksa (404) bir daha denenmez. */
  let sesAkisYok = false;
  async function sesGetir(k, metin, tercih){
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), 30000) : null;
    try{
      const f = ortam.fetch;
      const istek = yol => f(k.url + yol, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ metin, tercih:tercih || sesTercihi() }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      /* Okuma hızı 1 değilse parça çalıcı sesi inceltir; o zaman tek WAV. */
      const akisli = !!ortam.pcmCal && !sesAkisYok && hiz() === 1;
      let res = await istek(akisli ? '/api/ses/akis' : '/api/ses');
      if(akisli && (res.status === 404 || res.status === 405)){ sesAkisYok = true; res = await istek('/api/ses'); }
      const baslik = h => (res.headers && res.headers.get && res.headers.get(h)) || '';
      let not = baslik('X-Ses-Not');
      try{ not = decodeURIComponent(not); }catch(e){ /* düz kalır */ }
      if(res.status === 200 && Number(baslik('X-Ses-Hz')) > 0 && res.body && typeof res.body.getReader === 'function'){
        return { akis:res, hz:Number(baslik('X-Ses-Hz')), motor:baslik('X-Ses-Motor'), not };
      }
      if(res.status !== 200 || typeof res.blob !== 'function') return null;
      return { blob:await res.blob(), motor:baslik('X-Ses-Motor'), not };
    }catch(e){
      return null;
    }finally{
      if(t) clearTimeout(t);
    }
  }
  /* Okunmayacak akan cevap bırakılır (HKM yazmayı keser, EMA sıcak kalır). */
  function sesBirak(r){ if(r && r.akis && r.akis.body) try{ const c = r.akis.body.cancel(); if(c && c.catch) c.catch(() => {}); }catch(e){ /* kapalı */ } }

  /* K3: okuma kuyruğu. Akan cevabın cümleleri geldikçe eklenir (ilk cümle
     cevap bitmeden okunur); `kapali` olunca son parçadan sonra King susar. */
  let sesKuyruk = null;      // { no, l:[metin], kapali, bekle, cihaz }
  function kuyrukAl(q){
    if(q.l.length) return Promise.resolve(q.l.shift());
    if(q.kapali) return Promise.resolve(null);
    return new Promise(ok => { q.bekle = () => { q.bekle = null; ok(q.l.length ? q.l.shift() : null); }; });
  }
  function kuyrukKapat(q){ if(!q) return; q.kapali = true; if(q.bekle) q.bekle(); }
  /* Doner: true (okundu ya da kesildi) | false (ilk parça bile gelmedi: cihaza düş). */
  async function sunucuSesi(k, q, no){
    const tercih = sesTercihi();
    let kilit = '';            // ses kilidi: ilk parçayı okuyan motor
    const getir = m => (m == null ? null : sesGetir(k, m, kilit || tercih).then(r => ({ m, r })));
    let sonraki = kuyrukAl(q).then(getir);
    for(let i = 0; ; i++){
      const x = await sonraki;
      if(!x) break;
      const m = x.m;
      let r = x.r;
      if(no !== sesNo){ sesBirak(r); return true; }
      if(!r && i > 0 && kilit && kilit !== tercih){
        r = await sesGetir(k, m, tercih);
        if(no !== sesNo){ sesBirak(r); return true; }
      }
      if(r && r.motor){
        if(r.motor !== kilit || r.not) sonNot = r.not || '';
        kilit = r.motor;
      }
      /* Sonraki parça bu çalarken istenir (ses arası boş kalmasın). */
      sonraki = r ? kuyrukAl(q).then(getir) : Promise.resolve(null);
      const s = !r ? 'olmadi' : r.akis ? await ortam.pcmCal(r.akis, r.hz, c => { calan = c; })
        : await ortam.oynat(r.blob, c => { calan = c; }, hiz());
      calan = null;
      if(no !== sesNo){ sonraki.then(y => sesBirak(y && y.r)); return true; }
      if(s !== 'bitti'){
        sonraki.then(y => sesBirak(y && y.r));
        q.cihaz = true;
        const kalan = [m].concat(q.l.splice(0));
        if(i === 0){ q.l = kalan; return false; }
        cihazSesi(kalan.join(' '));
        return true;
      }
      if(r.motor) sonMotor = r.motor;
    }
    if(no !== sesNo) return true;
    konusuyor = 0;
    durum();
    sohbetDevam();
    return true;
  }
  /* `devam`: 'acik' akan cevabın ilk cümlesi (kuyruk açık kalır), 'ek' açık
     kuyruğa yeni cümle, 'son' son parça (kuyruk kapanır). Açık kuyruk yoksa
     'ek' ve 'son' baştan okur. */
  function seslendir(metin, devam){
    const q0 = sesKuyruk;
    if(devam && devam !== 'acik'){
      /* Kesildiyse (sus) akan cevabın kalanı okunmaz. */
      if(!q0 || q0.no !== sesNo || q0.kapali) return;
      if(q0.cihaz){ if(metin) cihazSesi(metin, true); q0.kapali = devam === 'son'; if(q0.kapali && !metin && !konusuyor) sohbetDevam(); return; }
      if(metin) q0.l.push.apply(q0.l, sesParcalari(metin));
      if(devam === 'son') kuyrukKapat(q0); else if(q0.bekle) q0.bekle();
      return;
    }
    if(!metin) return;
    sus();
    const no = sesNo;
    const q = sesKuyruk = { no, l:sesParcalari(metin), kapali:devam !== 'acik', bekle:null, cihaz:false };
    const k = sesTercihi() === 'cihaz' ? null : baglanti();
    if(!k || !ortam.oynat){ q.cihaz = true; cihazSesi(metin); return; }
    konusuyor = 1;
    durum();
    kesiciAc();
    const dus = () => { if(no !== sesNo) return; q.cihaz = true; cihazSesi(q.l.splice(0).join(' ') || metin); };
    sunucuSesi(k, q, no).then(ok => { if(!ok) dus(); }, dus);
  }
  function cihazSesi(metin, ekle){
    const sz = ortam.sentez();
    if(!sz || !metin){ if(!ekle){ konusuyor = 0; durum(); } return; }
    if(!ekle) try{ sz.cancel(); }catch(e){ /* yok */ }
    if(sonMotor !== 'cihaz') sonNot = '';
    sonMotor = 'cihaz';
    const ses = sesSec(sz.getVoices ? sz.getVoices() : []);
    const parcalar = parcala(metin);
    konusuyor = (ekle ? konusuyor : 0) + parcalar.length;
    parcalar.forEach(p => {
      const u = ortam.soz(p);
      u.lang = 'tr-TR';
      if(ses) u.voice = ses;
      u.rate = 1.03 * hiz();
      u.onend = u.onerror = () => { konusuyor = Math.max(0, konusuyor - 1); durum(); if(!konusuyor) sohbetDevam(); };
      try{ sz.speak(u); }catch(e){ konusuyor = 0; }
    });
    durum();
    kesiciAc();
  }

  function dinle(){
    if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } return; }
    const hk = !hkmDinlemez() && ortam.kayitAc && algila() !== 'tarayici' ? baglanti() : null;
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
        /* Sesli sohbette gerçek hata döngüyü DURDURUR (sahada, 2026-10-19:
           masaüstünde tarayıcı tanıması her seferinde hata veriyor, King
           yeniden dinliyor ve «Ses tanınamadı» üst üste yığılıyordu). */
        if(sesliSohbet){ sesliSohbet = false; sessizSay = 0; soyle('Ses tanınamadı; sesli sohbeti durdurdum. Yazarak devam edebilirsin.'); return; }
        soyle(hata === 'no-speech' ? 'Bir şey duyamadım. Yeniden dener misin?' : 'Ses tanınamadı; yazarak da sorabilirsin.');
      }
  }

  /* Söz 29 (2026-10-19): HKM bağlıysa konuşma kaydedilir ve HKM yazıya döker:
     bu PC'de Whisper varsa o (ücretsiz, ses çıkmaz), yoksa Gemini. HKM ikisini
     de bulamazsa bir kez söylenir ve sonraki dinlemeler tarayıcının tanımasıyla
     yapılır. Kayıt sessizlikte (1,4 sn) kendiliğinden biter.
     Tek bir 503 küsmeye yetmez (2026-10-19: Whisper kurulu olduğu halde bir
     hata «Whisper yok» dedirtip HKM'yi kalıcı bırakıyordu): art arda iki
     başarısızlıkta 5 dakika tarayıcıya geçilir; mesaj HKM'nin nedenini yazar. */
  let hkmDinlemezBitis = 0;     // bu ana kadar tarayıcının tanıması (0: HKM)
  /* Masaüstü uygulamasında (Electron) tarayıcının tanıması Google'a gidemez ve
     her seferinde düşer (2026-10-21, kullanıcı: «ses yazıya dökülemiyor»).
     Orada tarayıcıya geçilmez; HKM her seferinde yeniden denenir. */
  const masaustu = () => typeof navigator !== 'undefined' && /Electron\//.test(navigator.userAgent || '');
  const hkmDinlemez = () => !masaustu() && hkmDinlemezBitis > ortam.simdi().getTime();
  let dinleHata = 0;            // art arda 503 sayısı
  let dinleNot = '';            // HKM'nin son «neden yazıya dökülemedi» notu
  const DINLE_ARA = 5 * 60 * 1000;
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
      const gonder = () => f(k.url + '/api/dinle', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token }, body:JSON.stringify({ wav, tercih:algila() }) });
      let res = await gonder();
      if(res.status === 503) res = await gonder();   // Whisper anlık düşebilir (GPU dolu); bir kez daha
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      if(res.status === 200 && g && typeof g.metin === 'string'){ dinleHata = 0; dinleNot = ''; return g.metin; }
      if(res.status === 503){
        dinleNot = g && Array.isArray(g.notlar) ? g.notlar.filter(Boolean).join(' ') : '';
        if(++dinleHata >= 2){
          hkmDinlemezBitis = ortam.simdi().getTime() + DINLE_ARA; dinleHata = 0;
        }
      }
      return null;
    }catch(e){ return null; }
  }
  async function kayitDinle(k, hazir){
    if(!hazir) sus();
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
        const neden = dinleNot ? ' (' + dinleNot.replace(/[.\s]+$/, '') + ')' : '';
        soyle(hkmDinlemez() ? 'HKM sesi yazıya dökemedi' + neden + '; birkaç dakika tarayıcının tanımasını deneyeceğim.'
          : masaustu() ? 'Ses yazıya dökülemedi' + neden + '. Yeniden konuşabilir ya da yazabilirsin.'
          : 'Ses yazıya dökülemedi' + neden + '; yazarak da sorabilirsin.');
        return;
      }
      tanindi(t, t ? '' : 'no-speech');
    };
    dinleyen = { stop:sonlandir, abort:() => { bitti = true; if(kayit) try{ kayit.bitir(); }catch(e){} dinleyen = null; durum(); } };
    durum();
    if(hazir){ kayit = hazir; kayit.devral(() => { sonlandir(); }, 0.02); ciz(false); return; }
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
    const l = akis.filter(m => !m.bekliyor).slice(-GUNLUK_EN_COK).map(m => Object.assign({ kim:m.kim, metin:m.foto ? '(fotoğraf)' : (m.metin || ''),
      satirlar:m.satirlar || null, son:m.son || null }, m.arastirma ? { arastirma:m.arastirma } : {},
      /* DEVRİM: ders, yasa ve gün kartları da gün boyu kalır (yeniden açınca başlık tek kalmasın). */
      m.ders ? { ders:m.ders } : {}, m.yasa ? { yasa:m.yasa } : {}, m.gun ? { gun:m.gun } : {}, m.yap ? { yap:true } : {}));
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
    return akis.filter(m => !m.bekliyor && (m.metin || m.foto)).map(m => Object.assign({ kim:m.kim === 'sen' ? 'sen' : 'king',
      metin:m.foto ? '(fotoğraf)' : String(m.metin || ''), satirlar:Array.isArray(m.satirlar) ? m.satirlar.map(String) : null },
      m.arastirma ? { arastirma:m.arastirma } : {}));
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
    sohbetBasYaz();                             // söz 33: HKM eski satırları göndermez
    ciz(true);
    return true;
  }
  function kayitAc(id){
    const k = kayitBul(id);
    if(!k) return false;
    if(aktifKayit !== id) sessizArsivle();
    akis = k.mesajlar.map(m => ({ kim:m.kim === 'sen' ? 'sen' : 'king', metin:String(m.metin || ''),
      satirlar:Array.isArray(m.satirlar) ? m.satirlar : null, kartlar:Array.isArray(m.kartlar) ? m.kartlar : undefined }));
    ortam.depo.sil(BAS());
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
  /* G (2026-10-21): «+» yalnız eklenecek şeyler (fotoğraf, kamera, ekran, PDF,
     barkod); çizginin altında sayfa ve işler. Hafıza, kaydet ve ayarlar
     raydaki Ayarlar'da. */
  const barkodNo = () => { const A = ARAC(); return A && Array.isArray(A.ISLER) ? A.ISLER.findIndex(x => x && x.id === 'barkod') : -1; };
  const ARACLAR = [
    { is:'foto-sec', grup:'ek', ad:'Fotoğraf', ip:'Seç ya da Ctrl+V ile yapıştır', kosul:() => true },
    { is:'kip:kamera', grup:'ek', ad:'Kamera', ip:'Masandaki kâğıda, kitaba bakar', kosul:() => ortam.kameraDestek() && kamListe.length > 0 },
    { is:'kip:ekran', grup:'ek', ad:'Ekran', ip:'Ekranını paylaş; sorduğunda bakarım', kosul:() => ortam.ekranDestek() },
    { is:'pdf-sec', grup:'ek', ad:'PDF', ip:'Metnini Merkez okur, King özetler', kosul:() => true },
    { is:'barkod', grup:'ek', ad:'Barkod', ip:'Ürünün barkodunu okut (SPİ)', kosul:() => barkodNo() >= 0 },
    { is:'ekran', grup:'is', ad:'Bu sayfayı göster', ip:'Bulunduğun LifeOS sayfasını okur', kosul:() => true },
    { is:'isler', grup:'is', ad:'Tüm işler', ip:'AYS, SPİ ve ESP’de King’le yapılanlar', kosul:() => !!(ARAC() && ARAC().isler) },
  ];
  /* Kipler (söz 27). kosul: cihaz destekliyor mu. */
  const KIPLER = [
    { id:'yaz', ad:'Yaz', ip:'Yazarak konuş; cevap yazılı gelir', kosul:() => true },
    { id:'dinle', ad:'Dinle', ip:'Sen yaz, King her cevabı sesli okusun', kosul:() => !!ortam.sentez() },
    { id:'konus', ad:'Konuş', ip:'Sesli sohbet: King konuşunca yeniden dinler', kosul:() => konusabilir() },
    { id:'ekran', ad:'Ekran', ip:'Ekranını paylaş; sorduğunda King o anki ekranı görür', kosul:() => ortam.ekranDestek() },
    { id:'kamera', ad:'Kamera', ip:'Kamerayı aç; sorduğunda King masandaki kâğıda, kitaba bakar', kosul:() => ortam.kameraDestek() && kamListe.length > 0 },
  ];
  /* Masaüstünde tarayıcı tanıması yok; HKM bağlıysa kayıt HKM'de yazıya dökülür. */
  function konusabilir(){ return !!ortam.tanima() || !!(ortam.kayitAc && baglanti()); }
  function kip(){ return paylasim ? (kameraMi() ? 'kamera' : 'ekran') : sesliSohbet ? 'konus' : cevapBicimi() === 'ses' ? 'dinle' : 'yaz'; }
  async function kipSec(id){
    if(!KIPLER.some(x => x.id === id && x.kosul())) return false;
    const once = kip();
    if(id === 'yaz' || id === 'dinle') paylasimNo++;   // izni beklenen ekran ya da kamera da açılmaz
    if(id === once) return true;
    /* Ekran ile Konuş birlikte (2026-10-21, kullanıcı: «ekranımı görürken aynı
       zamanda konuşabilelim»): biri açıkken öteki seçilirse ilki kapanmaz.
       Yaz ve Dinle ikisini de bitirir. */
    const gorsel = id === 'ekran' || id === 'kamera';   // Ekran ile Kamera birbirini kapatır
    const birlikte = (id === 'konus' && !!paylasim) || (gorsel && sesliSohbet);
    if(id === 'konus' && sesliSohbet) return true;
    if(!birlikte || gorsel) paylasimKapat();
    if(!birlikte){
      if(sesliSohbet){ sesliSohbet = false; if(dinleyen){ try{ dinleyen.stop(); }catch(e){ /* kapalı */ } } }
    }
    if(id === 'dinle'){ ortam.depo.yaz(CEVAP, 'ses'); ciz(false); return true; }
    if(cevapBicimi() === 'ses') ortam.depo.sil(CEVAP);
    if(id === 'yaz'){ sus(); ciz(false); return true; }
    if(id === 'konus') return sesliSohbetAc();
    if(id === 'ekran') return paylasimBaslat();
    if(id === 'kamera') return kameraAc();
    return false;
  }
  /* Kip seçici açılır menü (2026-10-19, kullanıcı: «Dinle, Konuş ekranı da
     güzel bir yere; açılır kısım olsun»): başlıkta seçili kipin tek hapı;
     dokununca kipler açıklamalarıyla açılır. Derinlik menüsünün kalıbı. */
  function kipHtml(){
    const l = KIPLER.filter(x => { try{ return x.kosul(); }catch(e){ return false; } });
    if(l.length < 2) return '';
    const k = kip(), su = l.find(x => x.id === k) || l[0];
    return '<div class="king__kip-yer"><button type="button" class="king__kip-dugme' + (kipAcik ? ' is-acik' : '') + (k !== 'yaz' ? ' is-canli' : '')
      + '" data-king="kipler" aria-haspopup="menu" aria-expanded="' + (kipAcik ? 'true' : 'false')
      + '" aria-label="Konuşma biçimi: ' + su.ad + '" title="' + kac(su.ip) + '">' + KIP_SVG[su.id] + '<span>' + su.ad + '</span>'
      + '<svg class="king__kip-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></button>'
      + (kipAcik ? '<div class="king__arac-menu king__kip-menu" role="menu" aria-label="Konuşma biçimi">' + l.map(x => '<button type="button" role="menuitemradio" class="king__arac king__kip-sec'
          + (x.id === k ? ' is-secili' : '') + '" aria-checked="' + (x.id === k ? 'true' : 'false') + '" data-king="kip:' + x.id + '">'
          + KIP_SVG[x.id] + '<span><b>' + x.ad + '</b><small>' + kac(x.ip) + '</small></span>'
          + (x.id === k ? '<svg class="king__kip-tik" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '') + '</button>').join('') + '</div>' : '')
      + '</div>';
  }
  const KIP_SVG = {
    yaz:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    dinle:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.5"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.5"/></svg>',
    konus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>',
    ekran:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="11.5" rx="2"/><path d="M9 20h6M12 16.5V20"/></svg>',
    kamera:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 11l5-3v8l-5-3"/></svg>',
  };
  /* Kip paneli: Dinle, Konuş ve Ekran için yazı alanının üstünde tek şerit. */
  function kipPanel(){
    const k = kip();
    /* G: ince şerit — küçük önizleme (dokununca çalışma alanında büyür), canlı
       nokta, işler; «Arada yorum» Ayarlar › Görüntü'de. */
    if(k === 'ekran' || k === 'kamera') return '<div class="king__paylasim king__kip-panel king__kip-panel--ekran king__kip-panel--' + k + '" role="status">'
      + (menu === 'onizle' ? '' : '<button type="button" class="king__ekran-onizle" data-king="onizle-buyut" data-king-onizle aria-label="'
        + (k === 'kamera' ? 'Kameranın önizlemesi; büyüt' : 'Paylaşılan ekranın önizlemesi; büyüt') + '" title="Büyüt"></button>')
      + '<div class="king__kip-metin"><b><i class="king__canli" aria-hidden="true"></i>' + (k === 'kamera' ? 'Kameran açık' : 'Ekranın paylaşılıyor') + (sesliSohbet ? ' · sesli sohbet' : '') + '</b>'
      + '<span>' + (gozAcik() ? 'Arada bir kendim de bakarım; görüntü saklanmaz.' : 'Yalnız sorduğunda bakarım; görüntü saklanmaz.') + '</span>'
      + '<div class="king__kip-eylem"><button type="button" class="king__cip' + (k === 'kamera' && fotoHedef != null ? '' : ' king__cip--ana') + '" data-king="' + k + '-sor">' + (k === 'kamera' ? 'Kamerada' : 'Ekranda') + ' ne görüyorsun?</button>'
      /* Söz 37: modülün fotoğraf işleri kameranın o anki karesiyle (barkod, öğün, soru, sayfa). */
      + (k === 'kamera' ? fotoIsleri().map((x, i) => '<button type="button" class="king__cip' + (fotoHedef === i ? ' king__cip--ana' : '') + '" data-king="kam-is:' + i + '">' + kac(x.ad) + '</button>').join('') : '')
      + (ortam.tanima() || ortam.kayitAc ? '<button type="button" class="king__cip" data-king="ekran-ses">' + (sesliSohbet ? 'Sesli konuşmayı bitir' : 'Sesli konuş') + '</button>' : '')
      + '<button type="button" class="king__cip king__cip--dur" data-king="paylasim-bitir">Durdur</button></div></div></div>';
    /* Söz 30: Konuş kutusuz; ince şerit. Ses seçimi ··· menüsünde. */
    if(k === 'konus') return '<div class="king__kip-panel king__kip-panel--konus" role="status">'
      + '<span class="king__ses-kure" aria-hidden="true">' + KURE + '</span>'
      + '<b class="king__ses-durum"><span class="d-dinliyor">Dinliyorum…</span><span class="d-konusuyor">King konuşuyor…</span><span class="d-sira">Sıra sende</span></b>'
      + '<button type="button" class="king__hap king__hap--simge" data-king="kip:yaz" aria-label="Sesli sohbeti bitir" title="Bitir (ya da «tamam» de)">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></div>';
    return '';   // Dinle kutusuz: susturmak için küreye dokun, kapatmak için «Yaz»
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
  /* ======================================================================
     G AŞAMASI (2026-10-21, kullanıcının onayladığı yerleşim;
     belgeler/ekip/KING-ARAYUZ.md): solda ince ray (Sohbet, Görevler,
     Rutinler, Kütüphane; altta Ayarlar), yanında seçili bölümün listesi
     (kapanır; eski kenar çubuğu, `yan`), ortada sohbet, sağda çalışma alanı
     (eski «···» paneli, `menu`): sohbet kapanmadan yanında açılır.
     ====================================================================== */
  const BOLUMLER = [
    { id:'sohbet', ad:'Sohbet', svg:'<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 16.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6.5A1.5 1.5 0 0 1 5 5z"/>' },
    { id:'araclar', ad:'Araçlar', svg:'<path d="M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z"/><path d="M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>' },
    { id:'gorev', ad:'Görevler', svg:'<path d="M10 7h10M10 12h10M10 17h10"/><path d="M3.8 7l1.4 1.4L7.8 5.6M3.8 12l1.4 1.4 2.6-2.8"/><circle cx="5.5" cy="17" r="1.3"/>' },
    { id:'rutin', ad:'Rutinler', svg:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v3.8h-3.8"/><path d="M12 8.5V12l2.5 1.6"/>' },
    { id:'kutuphane', ad:'Kütüphane', svg:'<rect x="4" y="4.5" width="4" height="15" rx="1"/><rect x="10" y="4.5" width="4" height="15" rx="1"/><path d="M15.8 6.1l3.4-.9 2.6 13.4-3.4.9z"/>' },
  ];
  const SVG_AYAR = '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>';
  let bolum = 'sohbet';
  function listeGorunur(){ return ortam.genis() ? !yanDar() : yanAcik; }
  function listeAc(ac){
    if(ortam.genis()){ if(yanDar() === !!ac) yanDarSec(!ac); }
    else yanAcik = !!ac;
    if(ac && !ortam.genis()) menu = null;      // dar ekranda katmanlar üst üste binmez
  }
  /* Raydaki bölüm: listesi açılır; açık bölüme yeniden dokunmak listeyi kapatır. */
  function bolumSec(id){
    if(!BOLUMLER.some(b => b.id === id)) return false;
    if(bolum === id && listeGorunur()) listeAc(false);
    else{
      bolum = id; klasorYeni = false; tasinan = null;
      if(id === 'araclar' || id === 'kutuphane') kvGiris = true;
      if(id !== 'araclar'){ kvDuzen = false; kvSecili = null; kvYeni = false; }
      if(id === 'kutuphane'){ kutFiltre = 'hepsi'; kutBuyuk = null; }
      listeAc(true);
      if(id === 'gorev') isYokla();
      if(id === 'rutin') beceriTazele();
    }
    ciz(false);
    return true;
  }
  function rayHtml(){
    const gorunur = listeGorunur(), is = isDurum && isDurum.acik > 0 ? Number(isDurum.acik) : 0;
    const dugme = (eylem, ad, svg, secili, ek, nokta) => '<button type="button" class="king__ray-is' + (secili ? ' is-secili' : '') + '" data-king="' + eylem + '"'
      + ' aria-label="' + kac(ad) + '" data-ipucu="' + kac(ad) + '"' + (secili ? ' aria-current="true"' : '') + (ek || '') + '>'
      + '<svg viewBox="0 0 24 24" aria-hidden="true">' + svg + '</svg>' + (nokta ? '<i class="king__ray-nokta" aria-hidden="true"></i>' : '') + '</button>';
    return '<nav class="king__ray" aria-label="King bölümleri">'
      + BOLUMLER.map(b => dugme('bolum:' + b.id, b.ad + (b.id === 'gorev' && is ? ' · ' + is + ' iş çalışıyor' : ''), b.svg,
        menu !== 'menu' && (gorunur || (bolum === 'araclar' || bolum === 'kutuphane') ? bolum === b.id : b.id === 'sohbet'), '', b.id === 'gorev' && is)).join('')
      + '<span class="king__ray-bosluk" aria-hidden="true"></span>'
      + dugme('menu', 'Ayarlar', SVG_AYAR, menu === 'menu', ' aria-expanded="' + (menu === 'menu' ? 'true' : 'false') + '"')
      + '</nav>';
  }
  const SVG_YENI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-6.5"/><path d="M17.6 3.9a1.6 1.6 0 0 1 2.3 2.3L12.5 13.6l-3 .8.8-3z"/></svg>';
  const SVG_KLASOR_EKLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 10.5v5M9.5 13h5"/></svg>';
  const SVG_PANO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4.5" width="16" height="15" rx="2"/><path d="M4 9.5h16M9.5 9.5v10"/></svg>';
  function listeHtml(){
    const b = BOLUMLER.find(x => x.id === bolum) || BOLUMLER[0];
    const ust = (eylem, ad, svg) => '<button type="button" class="king__yan-kapa" data-king="' + eylem + '" aria-label="' + ad + '" title="' + ad + '">' + svg + '</button>';
    const eylem = bolum === 'sohbet' ? ust('yeni-sohbet', 'Yeni sohbet', SVG_YENI)
      : bolum === 'gorev' && baglanti() ? ust('ekip-ac', 'Görev panosu', SVG_PANO)
      : bolum === 'rutin' && baglanti() ? ust('beceri-ac', 'Rutinleri düzenle', SVG_PANO)
      : bolum === 'kutuphane' ? ust('klasor-yeni', 'Yeni klasör', SVG_KLASOR_EKLE) : '';
    return '<aside class="king__yan" aria-label="' + b.ad + '"><div class="king__yan-ust"><h2 class="king__yan-baslik">' + b.ad + '</h2>'
      + eylem + yanDugmeHtml('king__yan-kapa') + '</div><div class="king__yan-govde">'
      + (bolum === 'gorev' ? gorevListe() : bolum === 'rutin' ? rutinListe() : bolum === 'kutuphane' ? kutDizin()
        : bolum === 'araclar' ? vitrinDizin() : sohbetListe())
      + '</div></aside>';
  }
  /* Sohbet listesi günlere göre (2026-10-21): Bugün, Dün, Son 7 gün, Son 30 gün, Daha eski. */
  const GUN_GRUP = ['Bugün', 'Dün', 'Son 7 gün', 'Son 30 gün', 'Daha eski'];
  function gunGrupla(l){
    const gun = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const bugun = gun(ortam.simdi()), out = {};
    const ad = k => {
      const d = new Date(k.zaman);
      if(isNaN(d)) return 'Daha eski';
      const f = Math.round((bugun - gun(d)) / 86400000);
      return f <= 0 ? 'Bugün' : f === 1 ? 'Dün' : f < 7 ? 'Son 7 gün' : f < 30 ? 'Son 30 gün' : 'Daha eski';
    };
    l.slice().sort((a, b) => String(b.zaman).localeCompare(String(a.zaman))).forEach(k => { const g = ad(k); (out[g] = out[g] || []).push(k); });
    return GUN_GRUP.filter(g => out[g]).map(g => ({ ad:g, l:out[g] }));
  }
  const listeGrup = (ad, ic) => '<section class="king__yan-grup"><h3 class="king__yan-ad">' + ad + '</h3>' + ic + '</section>';
  const yanBos = m => '<p class="king__yan-bos">' + m + '</p>';
  function sohbetListe(){
    const gecmis = arsivOku(), sabit = gecmis.filter(k => k.sabit);
    return (gecmis.length ? '<input class="king__ara" type="search" data-king-ara-girdi placeholder="Sohbetlerde ara" aria-label="Sohbetlerde ara" autocomplete="off"/>' : '')
      + (sabit.length ? listeGrup('Sabitlenenler', '<ul class="king__gecmis">' + sabit.map(gecmisSatir).join('') + '</ul>') : '')
      + gunGrupla(gecmis.filter(k => !k.sabit)).map(g => listeGrup(g.ad, '<ul class="king__gecmis">' + g.l.map(gecmisSatir).join('') + '</ul>')).join('')
      + (gecmis.length ? '' : yanBos('Geçmiş sohbet yok. «Yeni sohbet» dediğinde ya da gün değişince açık sohbet buraya geçer.'));
  }
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
    const K = (ayar && ayar.kartlar) || {}, fn = n => typeof K[n] === 'function';
    const s = (ad, ip, o) => Object.assign({ ad, ip }, o);
    const sec = ARACLAR.filter(a => { try{ return a.kosul(); }catch(e){ return false; } });
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
        D() && s('Notlarımda ara', 'Defter’deki notlarına dayanarak', { doldur:'notlarımda türev' }),
        s('Derse çevir', 'PDF ya da metinden kaynaklı ders ve sorular', { doldur:'derse çevir: ', merkez:true }),
        kdDersler().length && s('Derslerimden soru', 'Kendi derslerinden, tekrar takvimiyle', { calis:'derslerimden soru sor' }),
      ] },
      { ad:'Gör', l:[ek('foto-sec'), ek('kip:kamera'), ek('kip:ekran'), ek('ekran'), ek('barkod')] },
      { ad:'Planla ve takip et', l:[
        s('Bugünün özeti', 'Bu modülde bugün ne var', { hazir:HAZIR.findIndex(h => h.ozet) }),
        s('Odak sayacı', 'Başlıkta kalan süre; bitince kaydet', { doldur:'25 dakika matematik çalışalım' }),
        s('Sesli özet', 'Bugünü sesli dinle; Kütüphane’de kalır', { calis:'sesli özet' }),
        fn('gun') && s('Günüm', 'Bugünün maddeleri; sıradakini tek dokunuşla başlat', { calis:'günüm' }),
        fn('gun') && s('Günü kapat', 'Kalanlar ve sesli özet', { calis:'günü kapat' }),
        K.olcu && s('Kişisel yasalar', 'Ölçülerinden senin kuralların; ilişki, neden değil', { calis:'yasalarım' }),
        s('Sınav yolculuğu', 'Bu gidişle sınav günü ve «ne olursa» (AYS › Gelecek)', { calis:'gelecek sayfasını aç' }),
        s('Görev kur', 'King adım adım plan kurar; sen başlatırsın', { doldur:'bu hafta B1’e hazırla beni', merkez:true }),
        s('Haftalık değerlendirme', 'Merkez’in hafta raporu', { calis:'haftalık değerlendirme', merkez:true }),
        s('Çapraz bulgu', 'Modüller birbirini nasıl etkiliyor', { calis:'çapraz bulgu', merkez:true }),
        D() && s('Haftalık gözden geçirme', 'Üç soru; cevaplar Defter’e', { calis:'haftalık gözden geçirme' }),
        s('Kişisel deney', 'Bir kuralı dene; önce ve sonra karşılaştırılır', { doldur:'deney başlat: her gün 10 dakika yürüyüş' }),
        yetkiKatalog() && yetkiKatalog().bekleyenler && s('Bekleyen öneriler', 'Onaylar’da bekleyenler', { calis:'bekleyen öneriler' }),
      ] },
      { ad:'Kaydet', l:[
        D() && s('Günlük', 'Anlattığın Defter’e günlük olur', { calis:'günlük yazalım' }),
        D() && s('Deftere not', 'Tek satır not', { doldur:'deftere not: ' }),
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
    const t = ortam.simdi(), saat = t.getHours(), hepsi = gruplar.reduce((a, g) => a.concat(g.l), []);
    /* Modüllerin işleri (Tüm işler ile aynı kaynak, arac.js ISLER): bulunulan modül önce;
       King'in ortak işleri ve yukarıda zaten olan ad tekrar edilmez. */
    const modulGruplari = ((ARAC() && ARAC().isler) ? ARAC().isler() : []).filter(g => g.modul !== 'king')
      .map(g => ({ ad:g.ad, modul:g.modul, l:g.isler.filter(x => !hepsi.some(y => y.ad === x.ad))
        .map(x => s(x.ad, x.tur === 'foto' ? x.ne : '«' + String(x.ornek || '').trim() + '»', { is:'is-sec:' + x.i })) }))
      .filter(g => g.l.length);
    const bul = ad => hepsi.find(x => x.ad === ad);
    const simdi = [saat < 12 && bul('Bugünün özeti'), bul('Neye çalışayım'), bul('Konu anlat'), bul('Bana soru sor'),
      t.getDay() === 0 && bul('Haftalık gözden geçirme'), saat >= 19 && bul('Günlük'), odak() ? null : bul('Odak sayacı')]
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
  let kartOnbellek = null;
  function kartAyar(){
    if(kartOnbellek) return kartOnbellek;
    const v = ortam.depo.oku(KART), o = v && typeof v === 'object' ? v : {};
    kartOnbellek = { sabit:Array.isArray(o.sabit) ? o.sabit.filter(x => typeof x === 'string') : null,
      ozel:Array.isArray(o.ozel) ? o.ozel.filter(x => x && x.id && x.ad && x.metin) : [],
      renk:o.renk && typeof o.renk === 'object' ? o.renk : {}, emoji:o.emoji && typeof o.emoji === 'object' ? o.emoji : {} };
    return kartOnbellek;
  }
  function kartYaz(v){ kartOnbellek = null; ortam.depo.yaz(KART, v); }
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
    const A = kartAyar(), id = 'k' + ortam.simdi().getTime().toString(36) + rastgele(1296).toString(36);
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
  let kvDuzen = false, kvSecili = null, kvYeni = false, kvTaslak = '', kvGiris = true;
  function kartSimge(x, emoji){
    return emoji ? '<span class="kv-mini-simge kv-mini-simge--emoji" aria-hidden="true">' + kac(emoji) + '</span>'
      : '<span class="kv-mini-simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + (ARAC_SIMGE[x.ad] || (x.ozel ? ARAC_SIMGE['Kart yap'] : GRUP_SVG_MODUL)) + '</svg>'
        + (x.merkez && !baglanti() ? '<i class="kv-mini-merkez"></i>' : '') + '</span>';
  }
  function miniKutu(x, i, duzen){
    const A = kartAyar(), key = kartAnahtar(x), renk = A.renk[key] || x.renk, emoji = A.emoji[key] || '';
    const e = vitrinEylem(x), sonuk = x.merkez && !baglanti();
    const ornek = x.doldur != null ? x.doldur.trim() : x.calis || '';
    const ip = x.ip + (ornek ? ' · «' + ornek + '»' : '') + (sonuk ? ' · Merkez gerekli' : '');
    const ara = ' data-king-ara="' + kac((x.ad + ' ' + x.ip + ' ' + ornek).toLocaleLowerCase('tr')) + '"';
    const st = ' style="--i:' + (i || 0) + '"', rk = renk ? ' data-renk="' + renk + '"' : '';
    if(duzen){
      const sabit = sabitler(A).indexOf(key) >= 0;
      return '<div class="kv-mini is-duzen' + (kvSecili === key ? ' is-secili' : '') + '"' + rk + ara + st + '>'
        + '<button type="button" class="kv-mini-sec" data-king="kv-sec:' + kac(key) + '" aria-pressed="' + (kvSecili === key) + '" aria-label="' + kac(x.ad) + ': rengini ve simgesini düzenle">'
        + kartSimge(x, emoji) + '<span class="kv-mini-ad">' + kac(x.ad) + '</span></button>'
        + '<button type="button" class="kv-mini-rozet' + (sabit ? ' is-sabit' : '') + '" data-king="kv-sabit:' + kac(key) + '" aria-label="' + (sabit ? 'Kartlarımdan çıkar' : 'Kartlarıma ekle') + ': ' + kac(x.ad) + '" title="' + (sabit ? 'Kartlarımdan çıkar' : 'Kartlarıma ekle') + '">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (sabit ? 'M6 12h12' : 'M12 6v12M6 12h12') + '"/></svg></button></div>';
    }
    return '<button type="button" class="kv-mini' + (sonuk ? ' is-sonuk' : '') + '"' + rk + ara + st
      + (x.hazir != null ? ' data-king-hazir="' + x.hazir + '" data-king="hazir"' : ' data-king="' + kac(e.eylem) + '"')
      + ' title="' + kac(ip) + '" aria-label="' + kac(x.ad + ': ' + ip) + '">'
      + kartSimge(x, emoji) + '<span class="kv-mini-ad">' + kac(x.ad) + '</span></button>';
  }
  function tumKartlar(gruplar){ return (gruplar || yetenekler()).reduce((a, g) => a.concat(g.l.map(x => Object.assign({ renk:renkOf(g) }, x))), []); }
  function oneCikanlar(gruplar){
    const hepsi = tumKartlar(gruplar);
    return sabitler(kartAyar()).map(k => hepsi.find(x => kartAnahtar(x) === k)).filter(Boolean);
  }
  function kvPanel(x){
    const A = kartAyar(), key = kartAnahtar(x), sabit = sabitler(A).indexOf(key) >= 0;
    const renk = A.renk[key] || x.renk, emoji = A.emoji[key] || '';
    const dg = (eylem, ad, ek) => '<button type="button" class="kv-dugme' + (ek || '') + '" data-king="' + kac(eylem) + '">' + ad + '</button>';
    return '<div class="kv-panel" role="group" aria-label="' + kac(x.ad) + ' kartını düzenle" data-renk="' + renk + '">'
      + '<div class="kv-panel-bas">' + kartSimge(x, emoji) + '<div><b>' + kac(x.ad) + '</b><small>' + kac(x.ip) + '</small></div>'
      + '<button type="button" class="king__yan-kapa" data-king="kv-sec:" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>'
      + '<div class="kv-panel-satir"><span>Renk</span><div class="kv-renkler">' + KART_RENK.map(r => '<button type="button" class="kv-renk' + (r === renk ? ' is-secili' : '')
        + '" data-renk="' + r + '" data-king="kv-renk:' + r + '" aria-pressed="' + (r === renk) + '" aria-label="' + KART_RENK_AD[r] + '" title="' + KART_RENK_AD[r] + '"></button>').join('') + '</div></div>'
      + '<div class="kv-panel-satir"><span>Simge</span><div class="kv-emojiler">'
      + '<button type="button" class="kv-emoji kv-emoji--ozgun' + (emoji ? '' : ' is-secili') + '" data-king="kv-emoji:" aria-pressed="' + !emoji + '" aria-label="Özgün simge" title="Özgün simge"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + (ARAC_SIMGE[x.ad] || (x.ozel ? ARAC_SIMGE['Kart yap'] : GRUP_SVG_MODUL)) + '</svg></button>'
      + KART_EMOJI.map(m => '<button type="button" class="kv-emoji' + (m === emoji ? ' is-secili' : '') + '" data-king="kv-emoji:' + m + '" aria-pressed="' + (m === emoji) + '" aria-label="' + m + '">' + m + '</button>').join('')
      + '<input class="kv-emoji-gir" data-king-kv-emoji maxlength="8" placeholder="Başka" aria-label="Kendi emojin" value="' + (emoji && KART_EMOJI.indexOf(emoji) < 0 ? kac(emoji) : '') + '"/></div></div>'
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
      + '<label class="kv-alan"><span>Metin</span><textarea name="metin" rows="3" maxlength="600" required placeholder="Örn. Bugün ne öğrendim, birlikte değerlendirelim">' + kac(kvTaslak) + '</textarea></label>'
      + '<div class="kv-secim" role="radiogroup" aria-label="Dokununca"><label><input type="radio" name="gonder" value="1" checked/><span>Dokununca hemen sor</span></label>'
      + '<label><input type="radio" name="gonder" value="0"/><span>Yazı alanına koy, ben tamamlarım</span></label></div>'
      + '<div class="kv-panel-eylem"><button type="submit" class="kv-dugme kv-dugme--birincil">Kartı ekle</button>'
      + '<button type="button" class="kv-dugme" data-king="kv-yeni-kapat">Vazgeç</button></div></form>';
  }
  function vitrinHtml(){
    const gruplar = yetenekler(), one = oneCikanlar(gruplar), d = kvDuzen;
    const secili = d && kvSecili ? tumKartlar(gruplar).find(x => kartAnahtar(x) === kvSecili) : null;
    let panelYok = !!secili;
    const panel = l => { if(panelYok && l.some(x => kartAnahtar(x) === kvSecili)){ panelYok = false; return kvPanel(secili); } return ''; };
    const giris = kvGiris ? ' is-giris' : '';
    return '<section class="king__vitrin' + giris + (d ? ' is-duzen' : '') + '" data-king-vitrin aria-label="Araçlar">'
      + '<header class="kv-bas"><h2 class="kv-baslik">Araçlar</h2>'
      + '<input class="king__ara kv-ara" type="search" data-king-ara-girdi placeholder="Ara: ders, uyku, hesap…" aria-label="Araçlarda ara" autocomplete="off"/>'
      + '<button type="button" class="kv-dugme" data-king="kv-yeni"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Yeni kart</button>'
      + '<button type="button" class="kv-dugme' + (d ? ' kv-dugme--birincil' : '') + '" data-king="kv-duzen" aria-pressed="' + d + '">' + (d ? 'Bitti' : 'Düzenle') + '</button></header>'
      + (kvYeni ? kvYeniForm() : '')
      + (d ? '<p class="kv-ipucu">Kartı seç: rengini ve simgesini değiştir. <b>+</b> Kartlarım’a ekler, <b>−</b> çıkarır.'
        + (kartAyar().sabit ? ' <button type="button" class="kv-bag" data-king="kv-sifirla">Kartlarımı varsayılana döndür</button>' : '') + '</p>' : '')
      + '<div class="kv-grup kv-grup--one" style="--g:0"><h3 class="kv-grup-ad">Kartlarım<small>' + one.length + '</small></h3><div class="kv-izgara">'
        + one.map((x, i) => miniKutu(x, i, d)).join('')
        + (one.length ? '' : '<p class="kv-bos">Kartlarım boş. «Düzenle»yi aç, istediğin aracın <b>+</b>’sına dokun ya da «Yeni kart» ekle.</p>')
        + '</div>' + panel(one) + '</div>'
      + gruplar.map((g, gi) => {
        const l = g.l.map(x => Object.assign({ renk:renkOf(g) }, x));
        return '<div class="kv-grup" id="kv-' + gi + '" data-renk="' + renkOf(g) + '" style="--g:' + (gi + 1) + '"><h3 class="kv-grup-ad"><i class="kv-grup-nokta" aria-hidden="true"></i>' + kac(g.ad) + '<small>' + g.l.length + '</small></h3>'
          + '<div class="kv-izgara">' + l.map((x, i) => miniKutu(x, i, d)).join('') + '</div>' + panel(l) + '</div>';
      }).join('')
      + '<p class="kv-not">Dokun: hemen yapar ya da örneği yazı alanına koyar. Sayıları her zaman modülün kendi kodu üretir.</p>'
      + '</section>';
  }
  /* Sol dizin (kullanıcı, 2026-10-23: «sol tarafı bayağı küçült, sadece yazılar»): dar sütun, renk noktası ve ad. */
  function vitrinDizin(){
    return '<nav class="kv-dizin" aria-label="Yetenek grupları">' + yetenekler().map((g, i) => '<button type="button" class="kv-dizin-is" data-renk="' + renkOf(g) + '" data-king="vitrin-git:' + i + '">'
      + '<i class="kv-grup-nokta" aria-hidden="true"></i><span>' + kac(g.ad) + '</span></button>').join('') + '</nav>';
  }
  /* Liste satırı: başlık, alt satır, isteğe bağlı ince çubuk; tıklayınca çalışma alanı. */
  function listeSatir(eylem, bas, alt, ek, canli){
    return '<li><button type="button" class="king__satir" data-king="' + eylem + '"><span class="king__satir-bas">'
      + (canli ? '<i class="king__canli-nokta" aria-hidden="true"></i>' : '') + '<span>' + kac(bas) + '</span></span>'
      + (alt ? '<small>' + kac(alt) + '</small>' : '') + (ek || '') + '</button></li>';
  }
  function gorevListe(){
    if(!baglanti()) return yanBos('Görevler Merkez’de (HKM) çalışır; Merkez bağlı değil.');
    if(!ekip.yuklu) return '<p class="king__yan-bos" role="status">Yükleniyor…</p>';
    const sira = { suruyor:0, taslak:1, bitti:2, iptal:3 };
    const gorevler = ekip.gorevler.slice().sort((a, b) => (sira[a.durum] - sira[b.durum]) || (b.id - a.id)).slice(0, 12);
    const isler = ekip.isler.filter(i => i.tur !== 'gorev_adim' || ACIK_IS.indexOf(i.durum) >= 0).slice(0, 12);
    return listeGrup('Görevler', gorevler.length ? '<ul class="king__gecmis">' + gorevler.map(g => {
        const il = g.ilerleme || {}, oran = (il.bitti || 0) + '/' + (il.toplam || 0);
        return listeSatir('ekip-ac', g.hedef, oran + ' adım · ' + (g.durum_ad || g.durum), cubukHtml(il.yuzde, oran + ' adım bitti'), g.durum === 'suruyor');
      }).join('') + '</ul>'
      : yanBos('Görev yok. «Bu hafta B1’e hazırla beni» gibi yaz; King adım adım kurar, sen başlatmadan başlamaz.'))
      + listeGrup('Arka planda', isler.length ? '<ul class="king__gecmis">' + isler.map(i => listeSatir('ekip-ac', i.baslik,
          isAjanAd(i) + ' · ' + (i.durum_ad || i.durum), i.durum === 'calisiyor' ? cubukHtml(i.ilerleme, i.baslik + ': yüzde ' + (Number(i.ilerleme) || 0)) : '',
          ACIK_IS.indexOf(i.durum) >= 0)).join('') + '</ul>'
        : yanBos('Arka planda iş yok. «Arka planda … araştır» dersen ekibe veririm, sen konuşmaya devam edersin.'));
  }
  function rutinListe(){
    if(!baglanti()) return yanBos('Beceriler ve sözler Merkez’de (HKM) durur; Merkez bağlı değil.');
    if(!beceriV.yuklu) return '<p class="king__yan-bos" role="status">Yükleniyor…</p>';
    const sozler = beceriV.sozler.filter(s => s.durum === 'bekliyor' || s.durum === 'soruldu');
    return listeGrup('Beceriler', beceriV.beceriler.length ? '<ul class="king__gecmis">' + beceriV.beceriler.map(b => {
        const id = Number(b.id);
        return '<li class="king__satir-sar' + (b.acik ? '' : ' is-kapali') + '"><button type="button" class="king__satir" data-king="beceri-ac"><span class="king__satir-bas"><span>' + kac(b.ad) + '</span></span>'
          + '<small>' + kac(tetikMetni(b.tetik)) + '</small></button>'
          + '<button type="button" class="king__secim" role="switch" aria-checked="' + (b.acik ? 'true' : 'false') + '" data-king="beceri-' + (b.acik ? 'kapat' : 'ac') + ':' + id
          + '" aria-label="' + kac(b.ad) + (b.acik ? ' açık' : ' kapalı') + '"><span class="king__anahtar' + (b.acik ? ' is-acik' : '') + '" aria-hidden="true"><i></i></span></button></li>';
      }).join('') + '</ul>'
      : yanBos('Beceri yok. «Her pazartesi bana deneme hatırlat» ya da «‘ders bitti’ deyince mola aç» diye öğret.'))
      + listeGrup('Sözler', sozler.length ? '<ul class="king__gecmis">' + sozler.map(s => listeSatir('beceri-ac', s.metin,
          (s.durum_ad || s.durum) + (s.vade_metin ? ' · ' + s.vade_metin : ''))).join('') + '</ul>'
        : yanBos('Açık söz yok. «Yarın fizik sınavım var» dersen zamanı gelince nasıl geçtiğini sorarım.'));
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
  let kutFiltre = 'hepsi', kutBuyuk = null;
  /* Görseller: gönderdiğin fotoğrafın en çok 480 px'lik küçük kopyası, bu cihazda (en çok 18). */
  const GORSEL = 'lifeos.king.gorseller', GORSEL_EN_COK = 18;
  function gorseller(){ const l = ortam.depo.oku(GORSEL); return Array.isArray(l) ? l.filter(x => x && x.id && /^data:image\/jpeg;base64,/.test(String(x.src || ''))) : []; }
  function gorselSakla(url){
    if(typeof document === 'undefined' || typeof Image === 'undefined' || !url) return;
    const img = new Image();
    img.onload = () => {
      try{
        const o = Math.min(1, 480 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * o)); c.height = Math.max(1, Math.round(img.naturalHeight * o));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const d = ortam.simdi();
        ortam.depo.yaz(GORSEL, [{ id:'g' + d.getTime().toString(36), zaman:d.toISOString(), src:c.toDataURL('image/jpeg', 0.72) }].concat(gorseller()).slice(0, GORSEL_EN_COK));
        if(acik && bolum === 'kutuphane') ciz(false);
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
    akis.forEach(m => ekle(m.arastirma, null));
    arsivOku().forEach(k => k.mesajlar.forEach(m => ekle(m && m.arastirma, k.zaman)));
    return l.filter(x => { const a = x.tur + x.link; if(gor[a]) return false; gor[a] = true; return true; });
  }
  function kutVeri(){
    const medya = kutMedya();
    return { sohbet:arsivOku().slice(0, ARSIV_EN_COK), ders:kdDersler(), ses:sozetler(), video:medya.filter(x => x.tur === 'video'),
      okuma:medya.filter(x => x.tur === 'okuma'), gorsel:gorseller(),
      arastirma:akis.map((m, n) => ({ m, n })).filter(x => x.m && x.m.arastirma).reverse(), sira:sira() };
  }
  const ktUfak = (eylem, ad, svg) => '<button type="button" class="kt-ufak" data-king="' + kac(eylem) + '" aria-label="' + ad + '" title="' + ad + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + svg + '</svg></button>';
  const KT_X = '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>';
  function ktKart(o){
    const ic = '<span class="kt-simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + o.svg + '</svg></span><span class="kt-metin"><b>' + kac(o.bas) + '</b>'
      + (o.alt ? '<small>' + kac(o.alt) + '</small>' : '') + '</span>';
    const ort = ' class="kt-kart" style="--i:' + (o.i || 0) + '" data-king-ara="' + kac((o.bas + ' ' + (o.alt || '')).toLocaleLowerCase('tr')) + '"';
    if(o.href) return '<a' + ort + ' href="' + kac(o.href) + '" target="_blank" rel="noopener noreferrer">' + ic
      + '<span class="kt-dis" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6h9v9M18 6L7 17"/></svg></span></a>';
    return '<div' + ort + '>' + (o.eylem ? '<button type="button" class="kt-ana" data-king="' + kac(o.eylem) + '"' + (o.sohbete ? ' data-king-sohbete' : '') + '>' + ic + '</button>'
      : '<span class="kt-ana">' + ic + '</span>') + (o.ek ? '<span class="kt-ek">' + o.ek + '</span>' : '') + '</div>';
  }
  function ktSohbet(k, i, kls){
    const tasi = kls.length ? '<select class="kt-tasi" data-king-kt-tasi="' + kac(k.id) + '" aria-label="Klasöre taşı" title="Klasöre taşı"><option value="">Klasörsüz</option>'
      + kls.map(f => '<option value="' + kac(f.id) + '"' + (k.klasor === f.id ? ' selected' : '') + '>' + kac(f.ad) + '</option>').join('') + '</select>' : '';
    return ktKart({ i, svg:KT_SVG.sohbet, bas:kayitBasligi(k), alt:tarihYaz(k.zaman) + ' · ' + k.mesajlar.length + ' mesaj' + (k.modul && MODUL_AD[k.modul] ? ' · ' + MODUL_AD[k.modul] : ''),
      eylem:'kayit-ac:' + k.id, sohbete:true, ek:ktUfak('kayit:' + k.id, 'Önizle', KT_SVG.goz) + tasi });
  }
  function kutuphaneHtml(){
    const v = kutVeri(), f = kutFiltre, kls = klasorler();
    const say = id => v[id].length;
    const var_ = id => id === 'sohbet' ? (say(id) || kls.length || klasorYeni) : say(id);
    const l = KUT_BOLUM.filter(b => var_(b.id));
    const izgara = ic => '<div class="kt-izgara">' + ic + '</div>';
    const icerik = {
      sohbet:() => (klasorYeni ? '<form class="king__klasor-form kt-klasor-form" data-king-klasor><input class="king__ara" type="text" maxlength="40" placeholder="Klasör adı" aria-label="Klasör adı" data-king-klasor-ad/>'
          + '<button type="submit" class="kv-dugme kv-dugme--birincil">Ekle</button></form>' : '')
        + kls.map(fl => {
          const ic = v.sohbet.filter(k => k.klasor === fl.id);
          return '<div class="king__klasor kt-klasor"><div class="kt-klasor-bas"><svg viewBox="0 0 24 24" aria-hidden="true">' + KT_SVG.klasor + '</svg><span>' + kac(fl.ad) + '</span><small>' + ic.length + '</small>'
            + ktUfak('klasor-sil:' + fl.id, 'Klasörü kaldır; sohbetler silinmez', KT_X) + '</div>'
            + (ic.length ? izgara(ic.map((k, i) => ktSohbet(k, i, kls)).join('')) : '<p class="kt-not">Boş. Bir sohbeti kartındaki seçimle buraya taşı.</p>') + '</div>';
        }).join('')
        + izgara(v.sohbet.filter(k => !k.klasor || !kls.some(fl => fl.id === k.klasor)).map((k, i) => ktSohbet(k, i, kls)).join('')),
      ders:() => izgara(v.ders.map((d, i) => ktKart({ i, svg:KT_SVG.ders, bas:d.baslik, alt:d.kaynak + ' · ' + d.bolumler.length + ' bölüm · ' + d.sorular.length + ' soru', eylem:'kd-ac:' + i, sohbete:true })).join('')),
      ses:() => izgara(v.ses.map((x, i) => ktKart({ i, svg:KT_SVG.ses, bas:(MODUL_AD[x.modul] || 'Sesli özet') + ' · ' + tarihYaz(x.zaman), alt:x.satirlar[0] || '', eylem:'sozet-dinle:' + i })).join('')),
      video:() => izgara(v.video.map((x, i) => ktKart({ i, svg:KT_SVG.video, bas:x.baslik, alt:[x.alt, x.konu].filter(Boolean).join(' · '), href:x.link })).join('')),
      okuma:() => izgara(v.okuma.map((x, i) => ktKart({ i, svg:KT_SVG.okuma, bas:x.baslik, alt:[x.alt, x.konu].filter(Boolean).join(' · '), href:x.link })).join('')),
      gorsel:() => '<div class="kt-galeri">' + v.gorsel.map((x, i) => '<figure class="kt-gorsel" style="--i:' + i + '" data-king-ara="' + kac(tarihYaz(x.zaman).toLocaleLowerCase('tr')) + '">'
          + '<button type="button" class="kt-gorsel-ac" data-king="gorsel-buyut:' + kac(x.id) + '" aria-label="Büyüt: ' + kac(tarihYaz(x.zaman)) + '"><img src="' + x.src + '" alt="Gönderdiğin fotoğraf, ' + kac(tarihYaz(x.zaman)) + '" loading="lazy"/></button>'
          + ktUfak('gorsel-sil:' + x.id, 'Görseli sil', KT_X) + '<figcaption>' + kac(tarihYaz(x.zaman)) + '</figcaption></figure>').join('') + '</div>',
      arastirma:() => izgara(v.arastirma.map((x, i) => ktKart({ i, svg:KT_SVG.arastirma, bas:x.m.arastirma.konu, alt:(x.m.arastirma.izle.length + x.m.arastirma.oku.length) + ' kaynak · bu sohbette', eylem:'ars-ac:' + x.n })).join('')),
      sira:() => izgara(v.sira.map((x, i) => ktKart({ i, svg:KT_SVG.sira, bas:x.metin, alt:tarihYaz(x.zaman) + ' · Merkez bekleniyor', ek:ktUfak('sira-sil:' + i, 'Sıradan çıkar', KT_X) })).join('')),
    };
    const buyuk = kutBuyuk && v.gorsel.find(x => x.id === kutBuyuk);
    const toplam = l.reduce((a, b) => a + say(b.id), 0);
    return '<section class="king__kutuphane' + (kvGiris ? ' is-giris' : '') + '" data-king-kutuphane aria-label="Kütüphane">'
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
        + '<figure><img src="' + buyuk.src + '" alt="Gönderdiğin fotoğraf, ' + kac(tarihYaz(buyuk.zaman)) + '"/><figcaption>' + kac(tarihYaz(buyuk.zaman))
        + ktUfak('gorsel-sil:' + buyuk.id, 'Görseli sil', KT_X) + ktUfak('gorsel-buyut:', 'Kapat', KT_X) + '</figcaption></figure></div>' : '')
      + '</section>';
  }
  function kutDizin(){
    const v = kutVeri(), l = KUT_BOLUM.filter(b => v[b.id].length);
    return '<nav class="kv-dizin" aria-label="Kütüphane bölümleri">' + (l.length
      ? [{ id:'hepsi', ad:'Tümü' }].concat(l).map(b => '<button type="button" class="kv-dizin-is' + (kutFiltre === b.id ? ' is-secili' : '') + '"' + (b.renk ? ' data-renk="' + b.renk + '"' : '')
        + ' data-king="kut-filtre:' + b.id + '"><i class="kv-grup-nokta" aria-hidden="true"></i><span>' + b.ad + '</span>' + (b.renk ? '<small>' + v[b.id].length + '</small>' : '') + '</button>').join('')
      : yanBos('Henüz bir şey yok.')) + '</nav>';
  }
  /* Çalışma alanı: eski «···» paneli sohbetin yanında. Başlıkta geri, ad, kapat. */
  function alanBilgi(){
    if(menu === 'menu') return { ad:'Ayarlar' };
    if(menu === 'ekip') return { ad:'Görevler ve işler' };
    if(menu === 'beceri') return { ad:'Beceriler ve sözler' };
    if(menu === 'kisi') return { ad:'Beni nasıl tanıyorsun', geri:'menu' };
    if(menu === 'kayitlar') return { ad:'Kayıtlı sohbetler', geri:'menu' };
    if(menu === 'onizle') return { ad:kameraMi() ? 'Kamera' : 'Ekran' };
    if(typeof menu === 'string' && /^ars:\d+$/.test(menu)) return { ad:'Araştırma' };
    if(menu && menu.id){ const k = kayitBul(menu.id); return { ad:k ? kayitBasligi(k) : 'Kayıtlı sohbet', geri:'kayitlar' }; }
    return { ad:'' };
  }
  function alanHtml(){
    if(!menu) return '';
    const govde = menuHtml();
    if(!menu) return '';                         // içerik kayboldu (ör. araştırma sohbetten gitti)
    const b = alanBilgi();
    return '<aside class="king__alan" aria-label="' + kac(b.ad) + '"><div class="king__alan-bas">'
      + (b.geri ? '<button type="button" class="king__yan-kapa" data-king="' + b.geri + '" aria-label="Geri" title="Geri"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg></button>' : '')
      + '<h2 class="king__yan-baslik">' + kac(b.ad) + '</h2>'
      + '<button type="button" class="king__yan-kapa" data-king="alan-kapat" aria-label="Kapat" title="Kapat (Esc)">' + SVG_KAPAT + '</button></div>'
      + '<div class="king__alan-govde">' + govde + '</div></aside>';
  }
  function alanAc(v){
    menu = v; silOnay = null;
    if(v && !ortam.genis()) yanAcik = false;
    ciz(false);
  }
  /* «+» menüsü (G): önce eklenenler, çizginin altında sayfa ve işler. */
  const ARAC_SVG = {
    'foto-sec':'<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 15.5l-5-5-8.5 8.5"/>',
    'kip:kamera':'<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 11l5-3v8l-5-3"/>',
    'kip:ekran':'<rect x="3.5" y="5" width="17" height="11.5" rx="2"/><path d="M9 20h6M12 16.5V20"/>',
    'pdf-sec':'<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
    barkod:'<path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12"/>',
    ekran:'<path d="M5 4.5h9l5 5v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z"/><circle cx="11" cy="13.5" r="2.5"/><path d="M13 15.5l2.5 2.5"/>',
    isler:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  };
  function aracMenu(){
    if(!aracAcik) return '';
    const A = ARAC();
    /* Söz 37: Tüm işler — üç modülün King'le yapılan işleri, modüle göre. */
    if(aracSayfa === 'isler' && A && A.isler) return '<div class="king__arac-menu king__isler" role="menu" aria-label="Tüm işler">'
      + '<button type="button" role="menuitem" class="king__arac king__isler-geri" data-king="isler-geri"><b>‹ Tüm işler</b></button>'
      + A.isler().map(g => '<div class="king__isler-grup" role="group" aria-label="' + kac(g.ad) + '"><span class="king__isler-ad">' + kac(g.ad)
        + (g.burada ? '' : ' · oraya geçer') + '</span>'
        + g.isler.map(x => '<button type="button" role="menuitem" class="king__arac" data-king="is-sec:' + x.i + '"><b>' + kac(x.ad) + '</b><small>'
          + kac(x.tur === 'foto' ? 'Kamera ya da fotoğraf: ' + x.ne : '«' + String(x.ornek || '').trim() + '»') + '</small></button>').join('') + '</div>').join('')
      + '</div>';
    let grup = null;
    return '<div class="king__arac-menu" role="menu" aria-label="Ekle">'
      + ARACLAR.filter(a => { try{ return a.kosul(); }catch(e){ return false; } }).map(a => {
        const ayrac = grup && a.grup !== grup ? '<hr class="king__arac-ayrac"/>' : '';
        grup = a.grup;
        return ayrac + '<button type="button" role="menuitem" class="king__arac king__arac--simge" data-king="' + a.is + '">'
          + '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ARAC_SVG[a.is] || '') + '</svg><span><b>' + kac(a.ad) + '</b><small>' + kac(a.ip) + '</small></span></button>';
      }).join('') + '</div>';
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
    silOnay = null; aracAcik = false; kipAcik = false;
    if(menu && !ortam.genis()) yanAcik = false;   // dar ekranda liste ile çalışma alanı üst üste açılmaz
    if(menu === 'menu'){ mikTazele(); kamTazele(); }
    ciz(false);
  }

  function menuHtml(){
    if(menu === 'menu'){
      const b = cevapBicimi(), n = arsivOku().length, mk = mikSecili();
      const mikler = mikListe.filter(d => d && d.id && d.id !== 'default');
      const kameralar = kamListe.filter(d => d && d.id);
      const sec = (v, ad, ip) => '<button type="button" class="king__secim' + (b === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
        + (b === v ? 'true' : 'false') + '" data-king="cevap:' + v + '" title="' + ip + '">' + ad + '</button>';
      const gorselVar = gorselZincir().length > 0;
      /* G: ayarlar bölümlü (Bağlantı, Konuşma, Ses, Dinleme, Görüntü, Hafıza, Sohbet); başlıktaki «yapay zekâ · yerel» buraya geldi. */
      return '<div class="king__menu" role="group" aria-label="Sohbet ayarları">'
        + '<h3 class="king__menu-bolum">Bağlantı</h3>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">King</span><span class="king__durum' + (baglanti() ? ' is-bagli' : '') + '">'
        + (baglanti() ? 'yapay zekâ' : gorselVar ? 'görüntü açık' : 'yerel') + '</span></div>'
        + '<p class="king__menu-not">' + (baglanti() ? 'Sorular Merkez’deki King’e (yapay zekâ) gider; sayıyı yine modülün kodu üretir.'
          : gorselVar ? 'Merkez bağlı değil; sorulara yerel kurallarla, ekran ve fotoğrafa görüntü okuyan modelle cevap veririm.'
          : 'Merkez bağlı değil; yerel kurallarla cevaplarım. Görevler, rutinler ve görüntü Merkez’le açılır.') + '</p>'
        + '<h3 class="king__menu-bolum">Konuşma</h3>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Cevaplar</span><div class="king__secici" role="radiogroup" aria-label="Cevaplar">'
        + sec('oto', 'Otomatik', 'Konuşarak sorduğuna sesli, yazarak sorduğuna yazılı cevap')
        + sec('ses', 'Sesli', 'Yazsan da cevabı sesli okur; yazı da görünür')
        + sec('yazi', 'Yazılı', 'Konuşsan da cevap yalnız yazılı gelir') + '</div></div>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Tarz</span><div class="king__secici" role="radiogroup" aria-label="Konuşma tarzı">'
        + TARZLAR.map(v => '<button type="button" class="king__secim' + (tarz() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (tarz() === v ? 'true' : 'false') + '" data-king="tarz:' + v + '">' + TARZ_AD[v] + '</button>').join('') + '</div></div>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Düşünme</span><div class="king__secici" role="radiogroup" aria-label="Düşünme derinliği">'
        + DERIN_TERCIH.map(v => '<button type="button" class="king__secim' + (derinlik() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (derinlik() === v ? 'true' : 'false') + '" data-king="derinlik:' + v + '" title="' + kac(DERIN_IP[v]) + '">' + DERIN_AD[v] + '</button>').join('') + '</div></div>'
        + '<p class="king__menu-not">' + kac(DERIN_IP[derinlik()]) + '.' + (baglanti() ? '' : ' Düşünme Merkez bağlıyken geçerli.') + '</p>'
        + '<h3 class="king__menu-bolum">Ses</h3>'
        + '<div class="king__menu-satir"><span class="king__menu-ad">Ses</span><div class="king__secici" role="radiogroup" aria-label="Ses">'
        + SES_TERCIH.map(v => '<button type="button" class="king__secim' + (sesTercihi() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (sesTercihi() === v ? 'true' : 'false') + '" data-king="ses:' + v + '" title="' + kac(SES_IP[v]) + '">' + SES_AD[v] + '</button>').join('') + '</div></div>'
        + (sonMotor ? '<p class="king__menu-not" data-king-son-ses>Son okuyan: ' + kac(SES_AD[sonMotor] || sonMotor) + '.' + (sonNot ? ' ' + kac(sonNot) : '') + '</p>' : '')
        + '<div class="king__menu-satir"><span class="king__menu-ad">Hız</span><div class="king__secici" role="radiogroup" aria-label="Okuma hızı">'
        + HIZLAR.map(v => '<button type="button" class="king__secim' + (hiz() === v ? ' is-secili' : '') + '" role="radio" aria-checked="'
          + (hiz() === v ? 'true' : 'false') + '" data-king="hiz:' + v + '">' + String(v).replace('.', ',') + '×</button>').join('') + '</div></div>'
        + '<h3 class="king__menu-bolum">Dinleme</h3>'
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
        + uyanHtml()
        + '<h3 class="king__menu-bolum">Görüntü</h3>'
        + (kameralar.length > 1 ? '<div class="king__menu-satir"><span class="king__menu-ad">Kamera</span><div class="king__kisi-ekle">'
          + '<select data-king-kam aria-label="Kamera"><option value="">Varsayılan kamera</option>'
          + kameralar.map(d => '<option value="' + kac(d.id) + '"' + (kamSecili() === d.id ? ' selected' : '') + '>' + kac(d.ad) + '</option>').join('')
          + '</select></div></div>' : '')
        + '<div class="king__menu-satir king__menu-anahtar"><span class="king__menu-ad">Arada yorum</span>'
        + '<button type="button" class="king__secim" role="switch" aria-checked="' + (gozAcik() ? 'true' : 'false') + '" data-king="goz:' + (gozAcik() ? '0' : '1') + '" aria-label="Ekran ya da kamera açıkken arada bir bak">'
        + '<span class="king__anahtar' + (gozAcik() ? ' is-acik' : '') + '" aria-hidden="true"><i></i></span></button></div>'
        + '<p class="king__menu-not">Ekran ya da kamera açıkken arada bir kendim bakar, işine yarayacak bir şey görürsem söylerim. Görüntü saklanmaz.</p>'
        + (hafiza() && KISI() || sormaListesi().length ? '<h3 class="king__menu-bolum">Hafıza</h3>' : '')
        + (hafiza() && KISI() ? '<button type="button" class="king__menu-is" data-king="kisi">Beni nasıl tanıyorsun<span class="king__menu-say">'
          + kisiKayitlari().length + '</span></button>' : '')
        + (sormaListesi().length ? '<div class="king__menu-satir"><span class="king__menu-ad">Sormadan ekler: ' + kac(sormaListesi().join(', '))
          + '</span><button type="button" class="king__geri" data-king="sorma-sifirla">Hepsini sor</button></div>' : '')
        + '<h3 class="king__menu-bolum">Sohbet</h3>'
        + '<button type="button" class="king__menu-is" data-king="sohbet-kaydet">Sohbeti kaydet</button>'
        + '<button type="button" class="king__menu-is" data-king="kayitlar">Kayıtlı sohbetler<span class="king__menu-say">' + n + '</span></button>'
        + '<button type="button" class="king__menu-is king__menu-is--tehlike" data-king="temizle">Sohbeti temizle</button>'
        + '<p class="king__menu-not">Kayıtlar ' + kac(YER()) + ' durur; hiçbir sunucuya gitmez.</p></div>';
    }
    if(menu === 'ekip') return ekipHtml();
    if(menu === 'beceri') return beceriPanelHtml();
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
        + '<p class="king__menu-not">' + kac(tarihYaz(k.zaman)) + ' · ' + k.mesajlar.length + ' mesaj</p>'
        + '<ol class="king__kayit">' + k.mesajlar.map(m => '<li class="' + (m.kim === 'sen' ? 'is-sen' : 'is-king') + '"><b>' + (m.kim === 'sen' ? 'Sen' : 'King')
          + '</b><p>' + kac(m.metin) + '</p>' + (m.satirlar && m.satirlar.length ? '<ul>' + m.satirlar.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : '') + '</li>').join('') + '</ol>'
        + '<div class="king__cipler"><button type="button" class="king__cip king__cip--ana" data-king="indir:' + k.id + '">Dosya olarak indir</button>'
        + '<button type="button" class="king__cip" data-king="kopyala:' + k.id + '">Kopyala</button>'
        + '<button type="button" class="king__cip king__cip--tehlike" data-king="sil:' + k.id + '">' + (silOnay === k.id ? 'Emin misin? Sil' : 'Sil') + '</button></div>'
        + '</div>';
    }
    /* G: kameranın ya da ekranın büyük önizlemesi (şeritteki küçük önizlemeye dokununca). */
    if(menu === 'onizle'){
      if(!paylasim) return '<div class="king__menu"><p class="king__menu-bos">Kamera da ekran paylaşımı da kapalı.</p><div class="king__cipler">'
        + (KIPLER.find(x => x.id === 'kamera').kosul() ? '<button type="button" class="king__cip" data-king="kip:kamera">Kamerayı aç</button>' : '')
        + (ortam.ekranDestek() ? '<button type="button" class="king__cip" data-king="kip:ekran">Ekranı paylaş</button>' : '') + '</div></div>';
      return '<div class="king__menu"><div class="king__ekran-onizle king__ekran-onizle--buyuk" data-king-onizle aria-label="'
        + (kameraMi() ? 'Kameranın önizlemesi' : 'Paylaşılan ekranın önizlemesi') + '"></div>'
        + '<p class="king__menu-not">Görüntü yalnız sorduğunda' + (gozAcik() ? ' ve arada bir' : '') + ' okunur; saklanmaz, bilgisayardan çıkmaz.</p>'
        + '<div class="king__cipler"><button type="button" class="king__cip" data-king="' + (kameraMi() ? 'kamera' : 'ekran') + '-sor">Ne görüyorsun?</button>'
        + '<button type="button" class="king__cip king__cip--dur" data-king="paylasim-bitir">Durdur</button></div></div>';
    }
    if(typeof menu === 'string' && /^ars:\d+$/.test(menu)){
      const n = Number(menu.slice(4)), m = akis[n];
      if(!m || !m.arastirma){ menu = null; return ''; }
      return '<div class="king__menu"><p class="king__menu-not">' + kac(m.arastirma.konu) + '</p>' + arastirmaHtml(m, n) + '</div>';
    }
    return '';
  }

  function soyle(metin, satirlar, onizleme, son, ek){
    akis.forEach(m => { m.yeni = false; });
    akis.push(Object.assign({ kim:'king', metin, satirlar, onizleme, son, yeni:true }, ek || {}));
    /* Söz 8: ekranda son altı satır; söz 19: günün tamamı saklanır. */
    akis = akis.slice(-GUNLUK_EN_COK);
    /* G: geniş ekranda çalışma alanı sohbetin yanında açık kalır; dar ekranda sohbeti örttüğü için kapanır. */
    if(!ortam.genis()) menu = null;
    sakla();
    ciz();
    const sesle = sesleMi();
    if(sesliSohbet && (!ortam.sentez() || !sesle)) ortam.zamanla(sohbetDevam, 600);
    const okunan = ek && ek.okunan;
    if(ek && 'okunan' in ek) delete akis[akis.length - 1].okunan;
    if(sesle){
      const tam = sesNorm([metin].concat(satirlar || [], onizleme ? [onizleme.metin] : [], son ? [son] : [],
        ek && ek.soru ? [ek.soru.soru] : [], ek && ek.arastirma && ek.arastirma.ozet ? [ek.arastirma.ozet] : []).join('. '));
      /* K3: akarken okunan baş tekrar okunmaz; yalnız kalanı kuyruğa girer. */
      const o = okunan ? sesNorm(okunan) : '';
      if(o && tam.indexOf(o) === 0) seslendir(tam.slice(o.length).trim(), 'son');
      else seslendir(tam);
    }else if(okunan) seslendir('', 'son');
  }
  function sesNorm(s){ return String(s || '').replace(/\s+/g, ' ').replace(/\.\.+/g, '.').replace(/([!?])\./g, '$1').trim(); }

  /* ---------- söz 35: sohbetten kayıt ---------- */
  const BEKLEYEN_KAYIT = 'lifeos.king.bekleyen-kayit';   // [{ modul, metin, route, at }]; TASINAN'da
  const bulunanIs = {};                                  // oge id → modülün önizlemesi (kaydet fn)
  let bulunanNo = 0;
  /* Cümle ve bağlaçlara böl; sol parça kayıt gibi değilse sağla birleştir
     («elma ve armut yedim» bölünmez, «40 soru çözdüm ve 30 dk koştum» bölünür). */
  function parcalaGunluk(metin){
    const out = [];
    /* Cümle sınırları ortak bölücünün kuralıyla (giris.js); bağlaçta bölme ve
       «kayıt değilse sağla birleştir» kuralı King'in. */
    String(metin || '').split(/[.!?…]+(?=\s|$)|\n+|;/).forEach(cumle => {
      const ham = cumle.split(/(,\s*(?:(?:ve sonra|sonra da|sonra|ardından|ayrıca|bir de|ve)\s+)?|\s+(?:ve sonra|sonra da|sonra|ardından|ayrıca|bir de|ve)\s+)/i);
      let tampon = '';
      for(let i = 0; i < ham.length; i += 2){
        const p = (ham[i] || '').trim();
        tampon = tampon ? tampon + (ham[i - 1] || ' ') + p : p;
        if(veriGibi(tampon) || i + 2 >= ham.length){ if(tampon.trim()) out.push(tampon.trim()); tampon = ''; }
      }
    });
    /* Doğru/yanlış/boş ile başlayan parça öncekine bağlanır. */
    const birlesik = [];
    out.filter(x => x.length >= 3).forEach(x => {
      if(birlesik.length && DEVAM_RE.test(x)) birlesik[birlesik.length - 1] += ', ' + x; else birlesik.push(x);
    });
    return birlesik;
  }
  function veriKapisi(){
    return ayar && ayar.veri && typeof ayar.veri.onizle === 'function' ? ayar.veri
      : (L.GIRIS && L.GIRIS.kaynak ? L.GIRIS.kaynak() : null);
  }
  function kayitDegil(c){
    const O = L.Olumsuz;
    try{ if(O && O.olcumEngeli && O.olcumEngeli(c)) return true; }catch(e){ /* süzgeç yok */ }
    return soruMu(c);
  }
  const DEVAM_RE = /^(?:\d+\s*(?:'?[sy]?[iıuü]\s*)?(?:tane\s*)?(?:doğru|dogru|yanlış|yanlis|boş|bos|net)|(?:doğru|yanlış|boş)\w*\s+\d+)/i;
  const DUYGU_RE = /(memnun|mutlu|sevin|keyif|gurur|iyi hisset|kötü hisset|yorgun|yoruldum|üzgün|üzüldüm|stres|gergin|motive|heyecan|sıkıldım|bunald|rahatla|huzur)/i;
  function sohbettenBul(metin){
    const parcalar = parcalaGunluk(metin);
    if(parcalar.length < 2) return null;
    const veri = veriKapisi();
    const ogeler = [];
    let duygu = false;
    parcalar.forEach(c => {
      if(DUYGU_RE.test(c)) duygu = true;
      if(kayitDegil(c)) return;
      let p = null;
      if(veri) try{ p = veri.onizle(c); }catch(e){ p = null; }
      if(p && p.metin){ ogeler.push(yeniOge({ modul:ayar.modul, metin:String(p.metin), kaynak:c }, p)); return; }
      if(!veriGibi(c)) return;
      const n = NIYET.find(x => x.es.test(kucuk(c)));
      if(n && n.modul !== ayar.modul) ogeler.push(yeniOge({ modul:n.modul, metin:c, kaynak:c, route:n.route }));
    });
    if(!ogeler.length) return null;
    const Df = D();
    if(Df && (duygu || String(metin).trim().length >= 120)){
      ogeler.push(yeniOge({ modul:'defter', metin:duygu ? 'Anlattıklarını ve duygularını günlük olarak Defter’e yaz' : 'Bu anlattığını günlük olarak Defter’e yaz',
        kaynak:String(metin).trim(), secili:duygu || String(metin).trim().length >= 200 }));
    }
    return ogeler;
  }
  function yeniOge(o, p){
    const id = 'b' + (++bulunanNo);
    if(p) bulunanIs[id] = p;
    return { id, modul:o.modul, metin:o.metin, kaynak:o.kaynak || o.metin, route:o.route || '', secili:o.secili !== false, durum:'bekliyor' };
  }
  function bulunanGoster(ogeler, baslik){
    soyle(baslik, null, null, null, { bulunan:{ ogeler, bitti:false } });
  }
  const BULUNAN_DURUM = { kaydedildi:'kaydedildi', iletildi:'Onaylar’a iletildi', sirada:'o modül açılınca sorulacak',
    hata:'kaydedilemedi', eski:'süresi geçti, yeniden anlat', vazgecildi:'geçildi' };
  function bulunanHtml(m, n){
    if(!m.bulunan) return '';
    const b = m.bulunan, bekleyen = b.ogeler.filter(o => o.durum === 'bekliyor');
    const secili = bekleyen.filter(o => o.secili).length;
    return '<div class="king__bulunan">'
      + '<ul class="king__bulunan-liste">' + b.ogeler.map((o, i) => {
        const acik = o.durum === 'bekliyor';
        return '<li class="king__bulunan-oge is-' + o.durum + '">'
          + (acik ? '<button type="button" class="king__bulunan-sec" role="checkbox" aria-checked="' + (o.secili ? 'true' : 'false')
            + '" aria-label="' + kac(o.metin) + '" data-king="bul-sec:' + n + ':' + i + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>'
            : '<span class="king__bulunan-sec is-bitti" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>')
          + '<div class="king__bulunan-govde"><b>' + kac(o.metin) + '</b><small>'
          + (o.modul === 'defter' ? 'Defter' : NOKTA(o.modul) + kac(MODUL_AD[o.modul] || o.modul))
          + (acik ? (o.modul !== ayar.modul && o.modul !== 'defter' ? ' · o modüle gider' : '') : ' · ' + kac(BULUNAN_DURUM[o.durum] || o.durum)) + '</small></div></li>';
      }).join('') + '</ul>'
      + (bekleyen.length ? '<div class="king__bulunan-eylem"><button type="button" class="king__cip king__cip--ana" data-king="bul-kaydet:' + n + '"'
        + (secili ? '' : ' disabled') + '>' + (secili ? 'Seçilenleri kaydet (' + secili + ')' : 'Seçili kayıt yok') + '</button>'
        + '<button type="button" class="king__cip" data-king="bul-vazgec:' + n + '">Vazgeç</button></div>' : '')
      + '</div>';
  }
  function bekleyenKayitlar(){ const v = ortam.depo.oku(BEKLEYEN_KAYIT); return Array.isArray(v) ? v.filter(x => x && x.modul && x.metin) : []; }
  async function bulunanKaydet(n){
    const m = akis[n];
    if(!m || !m.bulunan) return null;
    const oturum = !!(L.HESAP && L.HESAP.durum && L.HESAP.durum().oturum && L.HESAP.gelenBirak);
    const sayac = { kaydedildi:0, iletildi:0, sirada:0, hata:0 };
    const gidilecek = {};
    for(const o of m.bulunan.ogeler){
      if(o.durum !== 'bekliyor') continue;
      if(!o.secili){ o.durum = 'vazgecildi'; continue; }
      try{
        if(o.modul === 'defter'){
          const Df = D();
          if(!Df) throw new Error('defter yok');
          await Df.yeni('Günlük · ' + bugunISO(), o.kaynak, 'not');
          o.durum = 'kaydedildi';
        }else if(o.modul === ayar.modul){
          const p = bulunanIs[o.id];
          if(!p || typeof p.kaydet !== 'function'){ o.durum = 'eski'; continue; }
          const r = await p.kaydet();
          o.durum = r && r.ok === false ? 'hata' : 'kaydedildi';
        }else if(oturum){
          await L.HESAP.gelenBirak(o.modul, o.kaynak);
          o.durum = 'iletildi';
        }else if(await kutuyaBirak(o.modul, o.kaynak)){
          o.durum = 'sirada';                  // HKM kutusunda; o modülde King açılınca sorulur
        }else{
          ortam.depo.yaz(BEKLEYEN_KAYIT, bekleyenKayitlar().concat([{ modul:o.modul, metin:o.kaynak, route:o.route, at:bugunISO() }]).slice(-40));
          o.durum = 'sirada';
          gidilecek[o.modul] = o.route || 'today';
        }
      }catch(e){ o.durum = 'hata'; }
      if(sayac[o.durum] != null) sayac[o.durum]++;
      delete bulunanIs[o.id];
    }
    m.bulunan.bitti = true;
    const parca = [];
    if(sayac.kaydedildi) parca.push(sayac.kaydedildi + ' kayıt kaydedildi');
    if(sayac.iletildi) parca.push(sayac.iletildi + ' kayıt ilgili modülün Onaylar’ına iletildi');
    if(sayac.sirada) parca.push(sayac.sirada + ' kayıt o modül açılınca onayına sunulacak');
    if(sayac.hata) parca.push(sayac.hata + ' kayıt kaydedilemedi');
    sakla();
    soyle(parca.length ? parca.join(', ') + '.' : 'Hiçbir şey kaydetmedim.');
    const git = Object.keys(gidilecek);
    if(git.length){ cipler = git.map(mod => ({ ad:MODUL_AD[mod] + '’yi aç', is:'bul-git:' + mod + ':' + gidilecek[mod] })); ciz(false); }
    return sayac;
  }
  /* Mimari denetim (2026-10-19): oturum yoksa öbür modülün kaydı HKM'nin
     kutusuna (core/kutu.py) bırakılır; HKM satırı anlamaz, yalnız taşır. */
  async function kutuyaBirak(modul, metin){
    const k = baglanti();
    if(!k) return false;
    try{
      const res = await ortam.fetch(k.url + '/api/kutu', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ modul, metin, kaynak:ayar && ayar.modul }) });
      return res.status === 200;
    }catch(e){ return false; }
  }
  async function kutudanAl(){
    const k = baglanti();
    if(!k || !ayar) return [];
    try{
      const res = await ortam.fetch(k.url + '/api/kutu?modul=' + ayar.modul, { headers:{ 'Authorization':'Bearer ' + k.token } });
      const g = res.status === 200 ? await res.json() : null;
      return g && Array.isArray(g.kayitlar) ? g.kayitlar.filter(x => x && x.metin) : [];
    }catch(e){ return []; }
  }
  async function kutuyuSun(){
    const l = await kutudanAl();
    if(l.length && acik && !mini){ bekleyenleriSun(l); ciz(false); }
  }
  /* Öbür modülde anlatılıp buraya ait olan kayıtlar: bu modülün ayrıştırıcısıyla yeniden önizlenir. */
  function bekleyenleriSun(ek){
    if(!ayar || mini) return false;
    const tum = bekleyenKayitlar(), bura = tum.filter(x => x.modul === ayar.modul).concat(Array.isArray(ek) ? ek : []);
    if(!bura.length) return false;
    ortam.depo.yaz(BEKLEYEN_KAYIT, tum.filter(x => x.modul !== ayar.modul));
    const veri = veriKapisi();
    const ogeler = [];
    bura.forEach(x => {
      let p = null;
      if(veri) try{ p = veri.onizle(x.metin); }catch(e){ p = null; }
      if(p && p.metin) ogeler.push(yeniOge({ modul:ayar.modul, metin:String(p.metin), kaynak:x.metin }, p));
    });
    const anlasilmayan = bura.length - ogeler.length;
    if(!ogeler.length){ soyle('Başka modülde anlattığın ' + bura.length + ' kaydı burada anlayamadım; buradan yeniden yazabilirsin: ' + bura.map(x => '«' + x.metin + '»').join(', ')); return true; }
    bulunanGoster(ogeler, 'Başka modülde anlattıklarından buraya ait ' + ogeler.length + ' kayıt var' + (anlasilmayan ? ' (' + anlasilmayan + ' tanesini anlayamadım)' : '') + ':');
    return true;
  }

  /* ---------- söz 34: öncelik, notlar, ritüel, yük, günlük, deney ---------- */
  const D = () => (L.DEFTER && L.DEFTER.kuruluMu && L.DEFTER.kuruluMu()) ? L.DEFTER : null;
  const ONCELIK_RE = /(neye çalışayım|ne çalışayım|neye çalışmalıyım|öncelikli konu|hangi konuya çalış|puan getir|en çok puan)/;
  async function oncelikIsle(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null;
    const K = ayar && ayar.kartlar;
    if(!K || typeof K.oncelik !== 'function'){ soyle('Öncelik listesi AYS’de; AYS’de «neye çalışayım» diyebilirsin.'); return { tur:'oncelik-yok' }; }
    let l = [];
    try{ l = (await K.oncelik()) || []; }catch(e){ l = []; }
    l = l.filter(x => x && x.ad).slice(0, 5);
    if(!l.length){ soyle('Henüz öncelik çıkaracak veri yok: deneme yanlışı ya da çözülmüş soru kaydı gerekiyor.'); return { tur:'oncelik-bos' }; }
    soyle('Şu konular en çok puan kurtarır (sınavda çıkma sıklığı × senin hatan; AYS’nin hesabı):', null, null, null,
      { sirali:l.map(x => ({ ad:String(x.ad), ust:String(x.ders || ''), alt:String(x.neden || ''), puan:x.puan, ham:x })) });
    return { tur:'oncelik', n:l.length };
  }
  function siraliHtml(m, n){
    if(!m.sirali || !m.sirali.length) return '';
    const acilir = !!(ayar && ayar.kartlar && typeof ayar.kartlar.oncelikAc === 'function');
    return '<ol class="king__sirali">' + m.sirali.map((x, i) => '<li class="king__sira">'
      + '<span class="king__sira-no">' + (i + 1) + '</span>'
      + '<div class="king__sira-govde"><b>' + kac(x.ad) + '</b>' + (x.ust ? '<small>' + kac(x.ust) + '</small>' : '')
      + (x.alt ? '<span>' + kac(x.alt) + '</span>' : '') + '</div>'
      + (acilir ? '<button type="button" class="king__cip" data-king="sira-ac:' + n + ':' + i + '">Öğren’de aç</button>' : '')
      + '</li>').join('') + '</ol>';
  }
  /* Not arama: Defter'in kendi deposu; puan = sorgu sözcüklerinin geçişi. */
  const NOT_RE = /(notlarım(?:da|ı|dan)? (?:ara|bul|bak|göre)|notlarımda|notlarımdan|not almıştım|not aldığım|notlarıma göre|notumda|notlarımı (?:ara|özetle))/;
  const NOT_DOLGU = /(^|\s)(notlarım(?:da|ı|dan|a)?|notumda|not|almıştım|aldığım|göre|ara|bul|bak|özetle|ne|neler|nedir|hakkında|ile|ilgili|bana|benim|bir|şey|geçen|hafta|söyle|mısın|misin|var|mı|mi|daha|önce|yazmıştım)(?=\s|$)/g;
  function notPuanla(liste, kelimeler){
    const k = s => String(s || '').toLocaleLowerCase('tr');
    return (liste || []).map(n => {
      const b = k(n.baslik), g = k(n.govde);
      const puan = kelimeler.reduce((p, w) => p + (b.indexOf(w) >= 0 ? 3 : 0) + (g.indexOf(w) >= 0 ? 1 : 0), 0);
      return { n, puan };
    }).filter(x => x.puan > 0).sort((a, b) => b.puan - a.puan).slice(0, 3).map(x => x.n);
  }
  function parcaOf(govde, kelimeler, en){
    const g = String(govde || '').replace(/\s+/g, ' ');
    const kg = g.toLocaleLowerCase('tr');
    let i = kelimeler.reduce((m, w) => { const j = kg.indexOf(w); return j >= 0 && (m < 0 || j < m) ? j : m; }, -1);
    if(i < 0) i = 0;
    const bas = Math.max(0, i - 80);
    return (bas ? '…' : '') + g.slice(bas, bas + (en || 600)) + (g.length > bas + (en || 600) ? '…' : '');
  }
  async function notAra(metin, t0){
    akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null;
    const Df = D();
    if(!Df){ soyle('Defter bu modülde kurulu değil; notlarına buradan bakamam.'); return { tur:'not-yok' }; }
    const kelimeler = t0.replace(/[.,!?;:«»"']/g, ' ').replace(NOT_DOLGU, ' ').replace(NOT_DOLGU, ' ').split(/\s+/).filter(w => w.length >= 3);
    let liste = [];
    try{ liste = (await Df.yukle()) || []; }catch(e){ liste = []; }
    const bulunan = kelimeler.length ? notPuanla(liste, kelimeler) : [];
    if(!bulunan.length){ soyle(kelimeler.length ? '«' + kelimeler.join(' ') + '» geçen bir not bulamadım.' : 'Notlarında neyi arayayım? Örneğin «notlarımda türev».'); return { tur:'not-bos' }; }
    const kaynak = bulunan.map(n => 'Kaynak: ' + (n.baslik || 'Başlıksız not'));
    cipler = [{ ad:'Defteri aç', is:'defter-ac' }];
    if(!baglanti()){
      soyle('Notlarında bunları buldum:', bulunan.map(n => (n.baslik || 'Başlıksız not') + ' — ' + parcaOf(n.govde, kelimeler, 140)));
      return { tur:'not-liste', n:bulunan.length };
    }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek); ciz(false);
    const istem = 'Kullanıcının kendi notlarından parçalar aşağıda. YALNIZ bu notlara dayanarak cevap ver; notlarda olmayanı «notlarında yok» de, uydurma.\n\n'
      + bulunan.map((n, i) => '[' + (i + 1) + '] ' + (n.baslik || 'Başlıksız not') + ': ' + parcaOf(n.govde, kelimeler, 600)).join('\n\n')
      + '\n\nSoru: ' + String(metin).trim();
    const r = await merkezeSor(istem, bek);
    akis = akis.filter(m => m !== bek);
    if(r.ok) soyle(r.text, kaynak, null, null, r.akti ? { yeni:false, okunan:r.okunan } : null);
    else soyle('Merkez cevap vermedi; bulduğum notlar:', bulunan.map(n => (n.baslik || 'Başlıksız not') + ' — ' + parcaOf(n.govde, kelimeler, 140)));
    cipler = [{ ad:'Defteri aç', is:'defter-ac' }];
    ciz(false);
    return { tur:'not-cevap', n:bulunan.length };
  }
  /* Haftalık ritüel: rapor + üç soru; cevaplar Defter'e, hedef açılışa. */
  const RITIM_RE = /(haftalık gözden geçirme|haftayı gözden geçir|haftalık ritüel|hafta sonu değerlendirmesi)/;
  const RITIM_SORU = ['Bu hafta ne iyi gitti?', 'Ne zorladı?', 'Gelecek haftanın tek hedefi ne olsun?'];
  const HEDEF = 'lifeos.king.hafta-hedef';
  let ritim = null;
  function haftaBasi(){
    const d = new Date(ortam.simdi().getTime());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function haftaHedefi(){ const v = ortam.depo.oku(HEDEF); return v && v.metin && v.hafta >= haftaBasi() ? String(v.metin) : ''; }
  async function ritimBaslat(metin){
    ritim = { cevaplar:[] };
    await merkezKomut(metin, 'hafta', 'Haftalık rapor');
    soyle(RITIM_SORU[0] + ' (Üç kısa soru; «vazgeç» dersen bırakırım.)');
    return { tur:'ritim' };
  }
  async function ritimIsle(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null;
    if(/^(vazgeç|bırak|iptal|sonra)/.test(kucuk(metin))){ ritim = null; soyle('Tamam, gözden geçirmeyi bıraktım.'); return { tur:'ritim-dur' }; }
    ritim.cevaplar.push(String(metin).trim());
    if(ritim.cevaplar.length < RITIM_SORU.length){ soyle(RITIM_SORU[ritim.cevaplar.length]); return { tur:'ritim' }; }
    const c = ritim.cevaplar;
    ritim = null;
    const hedef = c[2].slice(0, 200);
    ortam.depo.yaz(HEDEF, { hafta:nextHafta(), metin:hedef });      // pazar: gelecek hafta; öteki günler: bu hafta
    let notOldu = false;
    const Df = D();
    if(Df){
      try{ await Df.yeni('Haftalık gözden geçirme · ' + bugunISO(), RITIM_SORU.map((q, i) => '## ' + q + '\n' + c[i]).join('\n\n'), 'not'); notOldu = true; }catch(e){ notOldu = false; }
    }
    soyle('Kaydettim' + (notOldu ? ' (Defter’e not oldu)' : '') + '. Haftanın hedefi: «' + hedef + '». Her sabah açılışta hatırlatacağım.');
    return { tur:'ritim-bitti' };
  }
  function nextHafta(){
    const d = new Date(ortam.simdi().getTime());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + (d.getDay() === 0 ? 7 : 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Yük: modülün son 7 gün / önceki 7 gün kartları ve sinyali. */
  const YUK_RE = /(yük durumu|yüküm|yük göstergesi|çok mu yükleniyorum|tükeniyor muyum|yoruldum mu)/;
  function yukIsle(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null;
    const K = ayar && ayar.kartlar;
    let y = null;
    try{ y = K && typeof K.yuk === 'function' ? K.yuk() : null; }catch(e){ y = null; }
    if(!y || !Array.isArray(y.kartlar) || !y.kartlar.length){ soyle('Bu modülde yük göstergesi yok; AYS ve SPİ’de var.'); return { tur:'yuk-yok' }; }
    const l = y.kartlar.filter(x => x && x.ad).map(kartTemiz);
    soyle(y.sinyal || 'Son 7 gün, önceki 7 güne göre belirgin bir yük artışı görünmüyor.', null, null, null, { kartlar:l, bulgu:!!y.sinyal });
    return { tur:'yuk', sinyal:!!y.sinyal };
  }
  /* Günlük: anlattığın Defter'e; his (1–5) senin beyanın. */
  const GUNLUK_RE = /(günlük yazalım|günlüğe yaz|akşam günlüğü|günlük tutalım|bugünü anlatayım)/;
  let gunlukBekle = false, gunlukMetin = '';
  async function gunlukIsle(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() });
    const t = kucuk(metin);
    if(/^(vazgeç|bırak|iptal)/.test(t)){ gunlukBekle = false; gunlukMetin = ''; cipler = null; soyle('Tamam, günlüğü bıraktım.'); return { tur:'gunluk-dur' }; }
    if(!gunlukMetin){
      gunlukMetin = String(metin).trim();
      cipler = [1, 2, 3, 4, 5].map(n => ({ ad:String(n), is:'gunluk-his:' + n })).concat([{ ad:'Geç', is:'gunluk-his:0' }]);
      soyle('Not aldım. Bugünkü hissin 1 ile 5 arasında kaç? (5 çok iyi; istersen geç.)');
      return { tur:'gunluk-his' };
    }
    return gunlukBitir(/^[1-5]$/.test(t) ? Number(t) : 0);
  }
  async function gunlukBitir(his){
    const metin = gunlukMetin;
    gunlukBekle = false; gunlukMetin = ''; cipler = null;
    let ok = false;
    const Df = D();
    if(Df && metin){
      try{ await Df.yeni('Günlük · ' + bugunISO(), metin + (his ? '\n\nHis: ' + his + '/5 (benim beyanım)' : ''), 'not'); ok = true; }catch(e){ ok = false; }
    }
    soyle(ok ? 'Günlüğe yazdım (Defter).' + (his ? ' Hissin: ' + his + '/5.' : '') : 'Günlüğü kaydedemedim.');
    return { tur:'gunluk-bitti', his };
  }
  /* Kişisel deney: önceki dönem ile deney dönemi, modülün günlük ölçüsüyle. */
  const DENEY = () => 'lifeos.king.deney.' + ((ayar && ayar.modul) || 'x');
  const DENEY_RE = /deney başlat(?:alım)?\s*:?\s*(.*)$/;
  const DENEY_DURUM_RE = /(deney(?:im)? (?:durumu|nasıl gidiyor|sonucu|bitti mi)|deneyi bitir)/;
  const DENEY_GUN = 14, DENEY_EN_AZ = 5;
  let deneyTaslak = null;
  function deneyOku(){ const v = ortam.depo.oku(DENEY()); return v && v.baslangic && v.olcu ? v : null; }
  function gunISO(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function gunKaydir(iso, n){ const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return gunISO(d); }
  function deneyBaslat(metin, kural){
    akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null;
    const O = ayar && ayar.kartlar && ayar.kartlar.olcu;
    if(!O || !Array.isArray(O.liste) || !O.liste.length){ soyle('Bu modülde deney için ölçü yok.'); return { tur:'deney-yok' }; }
    if(deneyOku()){ soyle('Süren bir deney var; önce «deneyi bitir» de.'); return { tur:'deney-var' }; }
    deneyTaslak = { kural:String(kural || '').trim().slice(0, 160) || 'kendi kuralın' };
    cipler = O.liste.map(o => ({ ad:o.ad, is:'deney-olcu:' + o.id }));
    soyle('Deney: «' + deneyTaslak.kural + '». ' + DENEY_GUN + ' gün süreceğim. Neyle ölçelim?');
    return { tur:'deney-olcu' };
  }
  function deneyOlcuSec(id){
    const O = ayar && ayar.kartlar && ayar.kartlar.olcu;
    const o = O && O.liste.find(x => x.id === id);
    if(!o || !deneyTaslak) return false;
    const v = { kural:deneyTaslak.kural, olcu:o.id, olcuAd:o.ad, birim:o.birim || '', baslangic:bugunISO(), gun:DENEY_GUN };
    deneyTaslak = null; cipler = null;
    ortam.depo.yaz(DENEY(), v);
    soyle('Başladı: ' + v.gun + ' gün «' + v.kural + '», ölçü ' + v.olcuAd + '. Sonunda önceki ' + v.gun + ' günle karşılaştıracağım.');
    return true;
  }
  function deneyHesap(v){
    const O = ayar && ayar.kartlar && ayar.kartlar.olcu;
    const ortala = (bas, n) => { const l = [];
      for(let i = 0; i < n; i++){ let x = null; try{ x = O.deger(v.olcu, gunKaydir(bas, i)); }catch(e){ x = null; }
        if(typeof x === 'number' && isFinite(x)) l.push(x); }
      return { n:l.length, ort:l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length * 10) / 10 : null }; };
    const gecen = Math.max(0, Math.round((new Date(bugunISO() + 'T12:00:00') - new Date(v.baslangic + 'T12:00:00')) / 864e5));
    return { once:ortala(gunKaydir(v.baslangic, -v.gun), v.gun), sira:ortala(v.baslangic, Math.min(v.gun, gecen + 1)), gecen };
  }
  function deneyDurum(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null;
    const v = deneyOku();
    if(!v){ soyle('Süren bir deney yok. «deney başlat 23:00’te yatacağım» gibi başlatabilirsin.'); return { tur:'deney-yok' }; }
    const h = deneyHesap(v), bitir = /bitir/.test(kucuk(metin)) || h.gecen >= v.gun;
    const fark = h.once.ort != null && h.sira.ort != null ? Math.round((h.sira.ort - h.once.ort) * 10) / 10 : null;
    const yeter = h.once.n >= DENEY_EN_AZ && h.sira.n >= DENEY_EN_AZ;
    const kart = [
      { ad:'Önce · ' + v.olcuAd, deger:h.once.ort, birim:v.birim, etiket:'hesaplandı', alt:h.once.n + ' gün veri' },
      { ad:'Deney · ' + v.olcuAd, deger:h.sira.ort, birim:v.birim, etiket:'hesaplandı', alt:h.sira.n + ' gün veri' },
      { ad:'Fark', deger:fark != null ? (fark > 0 ? '+' : '') + fark : null, birim:v.birim, etiket:'hesaplandı' },
    ].map(kartTemiz);
    if(bitir) ortam.depo.sil(DENEY());
    soyle((bitir ? 'Deney bitti' : 'Deney sürüyor (' + Math.min(h.gecen + 1, v.gun) + '/' + v.gun + ' gün)') + ': «' + v.kural + '». '
      + (yeter ? 'Bu bir gözlem; tek kişilik deney neden-sonuç kanıtı değildir.' : 'Karşılaştırma için veri yetersiz (her dönemde en az ' + DENEY_EN_AZ + ' gün gerekir).'),
      null, null, null, { kartlar:kart, bulgu:true });
    return { tur:bitir ? 'deney-bitti' : 'deney-durum', yeter };
  }

  /* ---------- söz 33: öneriler, ayar komutları, odak, Merkez komutları ---------- */
  function oneriListesi(cevapSonrasi){
    const l = [];
    if(cevapSonrasi){ l.push(['Detaylandır', 'Bunu biraz daha detaylandırır mısın?']); l.push(['Kısalt', 'Bunu daha kısa anlatır mısın?']); }
    const K = ayar && ayar.kartlar;
    if(K && typeof K.istatistik === 'function') l.push(['Kartları göster', 'istatistiklerim']);
    if(K && typeof K.soru === 'function') l.push(['Bana soru sor', 'bana soru sor']);
    if(!cevapSonrasi && K && typeof K.oncelik === 'function') l.unshift(['Neye çalışayım?', 'neye çalışayım']);
    return l.slice(0, 4).map(x => ({ ad:x[0], is:'oner-metin:' + x[1] }));
  }
  const TARZ = 'lifeos.king.tarz';      // 'samimi' | 'resmi' | 'kisa'; TASINAN'da
  const TARZLAR = ['samimi', 'resmi', 'kisa'];
  const TARZ_AD = { samimi:'Samimi', resmi:'Resmi', kisa:'Kısa' };
  function tarz(){ const v = ortam.depo.oku(TARZ); return TARZLAR.indexOf(v) > 0 ? v : 'samimi'; }
  function tarzSec(v){
    if(TARZLAR.indexOf(v) < 0) return false;
    if(v === 'samimi') ortam.depo.sil(TARZ); else ortam.depo.yaz(TARZ, v);
    ciz(false);
    return true;
  }
  /* «sesi Piper yap», «derin düşün»…: King'in kendi tercihleri (küçük, tekrar söyleyince değişir). */
  function ayarKomutu(t){
    const m = t.match(/(?:sesi|ses olarak)\s+(ema|piper|gemini|cihaz|otomatik)|(ema|piper|gemini|cihaz|otomatik)\s+ses(?:i|ine|le)\s*(?:geç|yap|kullan|olsun|oku)/);
    if(m){ const v = { ema:'ema', piper:'piper', gemini:'gemini', cihaz:'cihaz', otomatik:'oto' }[m[1] || m[2]]; sesTercihSec(v); return 'Sesi ' + SES_AD[v] + ' yaptım.'; }
    if(/derin(?:lemesine)? düşün/.test(t)){ derinlikSec('derin'); return 'Bundan sonra derin düşüneceğim; cevaplar biraz uzun sürebilir.'; }
    if(/hızlı (?:cevap ver|cevapla|düşün)/.test(t)){ derinlikSec('hizli'); return 'Bundan sonra hızlı cevaplayacağım.'; }
    if(/dengeli düşün/.test(t)){ derinlikSec('dengeli'); return 'Bundan sonra dengeli düşüneceğim.'; }
    if(/düşünmeyi otomatik/.test(t)){ derinlikSec('oto'); return 'Düşünme derinliğini mesaja göre ben seçeceğim.'; }
    if(/(?:cevapları|cevabı) sesli (?:oku|ver)|sesli cevap ver/.test(t)){ cevapSec('ses'); return 'Cevapları sesli okuyacağım.'; }
    if(/(?:cevapları|cevabı) yazılı ver|yazılı cevap ver|sesli okumayı kapat/.test(t)){ cevapSec('yazi'); return 'Cevapları yalnız yazılı vereceğim.'; }
    if(/resmi konuş/.test(t)){ tarzSec('resmi'); return 'Bundan sonra resmi konuşacağım.'; }
    if(/samimi konuş/.test(t)){ tarzSec('samimi'); return 'Tamam, samimi konuşuruz.'; }
    if(/(?:kısa ve öz|kısa) konuş/.test(t)){ tarzSec('kisa'); return 'Bundan sonra kısa ve öz konuşacağım.'; }
    if(/daha (hızlı|yavaş) oku/.test(t)){
      const i = HIZLAR.indexOf(hiz()), j = /hızlı/.test(t) ? Math.min(HIZLAR.length - 1, i + 1) : Math.max(0, i - 1);
      ortam.depo.yaz(HIZ, HIZLAR[j]);
      return 'Okuma hızı ' + String(HIZLAR[j]).replace('.', ',') + ' kat.';
    }
    return null;
  }
  const ODAK = 'lifeos.king.odak';      // { bitis, dk, konu }; TASINAN'da
  const ODAK_RE = /(?:(\d{1,3})\s*(?:dk|dakika)(?:lık)?\s*(.*?)\s*(?:çalışalım|çalışayım|odaklanalım|odaklanayım)(?![a-zçğıöşü]))|pomodoro|odak (?:modu|sayacı|zamanlayıcı)(?:nı|sı)? ?(?:başlat|aç)/;
  let odakSaat = null, odakAralik = null;
  function odak(){ const v = ortam.depo.oku(ODAK); return v && v.bitis ? v : null; }
  function odakBaslat(dk, konu){
    ortam.depo.yaz(ODAK, { bitis:ortam.simdi().getTime() + dk * 60000, dk, konu:konu || '' });
    odakKur();
    ciz(false);
  }
  function odakTemizle(){
    if(odakSaat) try{ clearTimeout(odakSaat); }catch(e){ /* yok */ }
    if(odakAralik) try{ clearInterval(odakAralik); }catch(e){ /* yok */ }
    odakSaat = null; odakAralik = null;
  }
  function odakKur(){
    odakTemizle();
    const v = odak();
    if(!v) return;
    const kalan = v.bitis - ortam.simdi().getTime();
    if(kalan <= 0){ odakBitti(); return; }
    odakSaat = ortam.zamanla(odakBitti, kalan);
    if(odak() && typeof document !== 'undefined' && typeof setInterval === 'function'){
      odakAralik = setInterval(() => {
        const el = document.querySelector('[data-odak-kalan]');
        const o = odak();
        if(el && o) el.textContent = odakYaz(o.bitis - ortam.simdi().getTime());
      }, 1000);
    }
  }
  function odakYaz(ms){
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function odakBitti(){
    const v = odak();
    odakTemizle();
    if(!v) return;
    ortam.depo.sil(ODAK);
    ortam.depo.yaz(ODAK_SON, { dk:v.dk, konu:v.konu || '', at:ortam.simdi().getTime() });
    if(ortam.bildir) ortam.bildir('King', 'Odak süresi doldu: ' + v.dk + ' dakika.');
    soyle('Süre doldu: ' + v.dk + ' dakika' + (v.konu ? ' ' + v.konu : '') + ' tamam. Kaydedeyim mi?');
    cipler = [{ ad:'Kaydet', is:'odak-kaydet:' + v.dk + ':' + encodeURIComponent(v.konu || '') }, { ad:'Gerek yok', is:'vazgec' }];
    ciz(false);
  }
  function odakDur(){
    const v = odak();
    odakTemizle();
    ortam.depo.sil(ODAK);
    soyle(v ? 'Odak sayacını durdurdum.' : 'Çalışan bir odak sayacı yok.');
  }
  function odakHtml(){
    const v = odak();
    if(!v) return '';
    return '<span class="king__odak" role="timer" aria-label="Odak sayacı">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 3h5"/></svg>'
      + '<b data-odak-kalan>' + odakYaz(v.bitis - ortam.simdi().getTime()) + '</b>'
      + '<button type="button" class="king__hap king__hap--simge" data-king="odak-dur" aria-label="Odak sayacını durdur" title="Durdur">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></span>';
  }
  const HAFTA_RE = /(haftalık değerlendirme|haftam nasıl|haftayı değerlendir|bu haftayı özetle)/;
  const CAPRAZ_RE = /(çapraz bulgu|modüller arası|neyi etkiliyor|bağlantıları göster|ilişkileri göster)/;
  async function merkezKomut(metin, komut, baslik){
    akis.push({ kim:'sen', metin:String(metin).trim() });
    cipler = null;
    const K = ayar && ayar.kartlar;
    let l = [];
    if(komut === 'hafta' && K && typeof K.istatistik === 'function'){
      try{ l = (K.istatistik() || []).filter(x => x && x.ad).map(kartTemiz).slice(0, 4); }catch(e){ l = []; }
    }
    const ek = l.length ? { kartlar:l } : {};
    if(!baglanti()){
      soyle(baslik + ' için Merkez (HKM) bağlı olmalı.' + (l.length ? ' Modülün kendi kartları:' : ''), null, null, null, ek);
      return { tur:'merkez-yok' };
    }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek);
    ciz(false);
    const r = await merkezeSor(komut);
    akis = akis.filter(m => m !== bek);
    soyle(r.ok ? r.text : baslik + ' alınamadı; Merkez cevap vermedi.', null, null, null, Object.assign({ bulgu:true }, ek));
    return { tur:'merkez-komut', komut };
  }
  /* Söz 33: Konuş kipinde araya girme. King konuşurken mikrofon yüksek
     eşikle dinlenir; konuşma başlarsa King susar ve seni dinler. */
  /* K3 (sağlam araya girme): kesici kayıt kapatılıp yeni mikrofon açılmaz;
     aynı kayıt devralınır ve konuşmanın başından (0,4 sn önce) yazıya dökülür.
     Eşik yüksek (0,06) ve 0,25 sn sürekli ses ister: King'in kendi sesi yankı
     giderimiyle bastırılır, tek bir tıkırtı kesmez. */
  let kesici = null;
  async function kesiciAc(){
    if(kesici || !(sesliSohbet || uyanTur) || !ortam.kayitAc || konusuyor <= 0) return;
    const no = sesNo;
    kesici = 'aciliyor';
    let k = null;
    try{
      k = await ortam.kayitAc(() => {}, mikSecili(), () => {
        if(no !== sesNo || kesici !== k) return;
        kesici = null;                       // devralındı: kesiciKapat kaydı kapatmasın
        sus();
        kesiciDevral(k);
      }, 0.06);
      if(kesici !== 'aciliyor' || no !== sesNo){ try{ k.bitir(); }catch(e){ /* kapalı */ } if(kesici === 'aciliyor') kesici = null; return; }
      kesici = k;
    }catch(e){ kesici = null; }
  }
  function kesiciDevral(k){
    const hk = baglanti();
    if(!acik || dinleyen || !hk || typeof k.devral !== 'function' || hkmDinlemez() || algila() === 'tarayici'){
      try{ k.bitir(); }catch(e){ /* kapalı */ }
      sohbetDevam();
      return;
    }
    kayitDinle(hk, k);
  }
  function kesiciKapat(){
    const k = kesici;
    kesici = null;
    if(k && k !== 'aciliyor') try{ k.bitir(); }catch(e){ /* kapalı */ }
  }
  /* Karşılama (2026-10-19, kullanıcı: «GPT'deki gibi; veriler karşılamada,
     sohbete başlayınca kaybolsun, yalnız sohbet kalsın»): boş sohbette
     selamın altında modülün kartları ve özeti. Sohbete yazılmaz; ilk
     mesajla ekrandan gider. Her çizimde taze okunur (kodun sayısı). */
  function karsilama(){
    if(!ayar || ayar.acilis === false) return { kartlar:[], satirlar:[] };
    let l = [];
    if(ayar.kartlar && typeof ayar.kartlar.istatistik === 'function'){
      try{ l = (ayar.kartlar.istatistik() || []).filter(x => x && x.ad).map(kartTemiz).slice(0, 4); }catch(e){ l = []; }
    }
    const ek = [];
    if(haftaHedefi()) ek.push('Haftanın hedefi: ' + haftaHedefi());
    const dv = deneyOku();
    if(dv){ const h = deneyHesap(dv); ek.push(h.gecen >= dv.gun ? 'Deneyin bitti: «deney sonucu» de.' : 'Deney: «' + dv.kural + '» · ' + (h.gecen + 1) + '/' + dv.gun + ' gün'); }
    return { kartlar:l, satirlar:ek.concat(ozetSatirlari()).slice(0, 4) };
  }
  function cizgi(seri){
    if(!Array.isArray(seri)) return '';
    const n = seri.filter(v => v != null);
    if(n.length < 2) return '';
    const en = Math.max.apply(null, n), az = Math.min.apply(null, n), a = (en - az) || 1, dx = 100 / (seri.length - 1);
    let d = '', bagli = false;
    seri.forEach((v, i) => {
      if(v == null){ bagli = false; return; }
      d += (bagli ? 'L' : 'M') + (i * dx).toFixed(1) + ' ' + (22 - (v - az) / a * 20).toFixed(1);
      bagli = true;
    });
    return '<svg class="king__kart-cizgi" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  /* ---------- söz 32: kartlar ---------- */
  const KART_ISTAT = /(istatistik|rakamlar[ıi]m|sayılar[ıi]m|verilerimi göster|kartlar[ıi]? göster|durum kartlar)/;
  const KART_SORU = /(soru sor|soru ver|soru getir|soru çek|soru çöz(elim|eyim)|beni test et|test et beni|bir soru daha)/;
  const SORU_DOLGU = /(^|\s)(bana|bir|tane|daha|soru|sor|sorar|ver|getir|çek|lütfen|king|hakkında|konusunda|ile|ilgili|beni|test|et|çözelim|çözeyim|mısın|misin|musun)(?=\s|$)/g;
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
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
    const K = ayar && ayar.kartlar ? ayar.kartlar : null;
    const ad = MODUL_AD[ayar && ayar.modul] || 'Bu modül';
    if(n.tur === 'istatistik'){
      let l = [];
      try{ l = (K && typeof K.istatistik === 'function' ? K.istatistik() : []) || []; }catch(e){ l = []; }
      l = l.filter(x => x && x.ad).map(kartTemiz).slice(0, 8);
      if(!l.length){ soyle(ad + ' için gösterilecek istatistik kartı yok.'); return { tur:'kart-yok' }; }
      soyle(ad + '’de son durum · sayıları ' + ad + ' kendi hesaplıyor.', null, null, null, { kartlar:l });
      return { tur:'kart-istatistik', kartlar:l.length };
    }
    if(!K || typeof K.soru !== 'function' || typeof K.cevapla !== 'function'){
      soyle('Soru bankası AYS’de; AYS’yi açıp «bana soru sor» diyebilirsin.');
      return { tur:'kart-yok' };
    }
    let q = null;
    try{ q = await K.soru(n.konu || ''); }catch(e){ q = null; }
    if(!q || !q.soru || !Array.isArray(q.sec) || !q.sec.length){
      soyle(n.konu ? '«' + n.konu + '» için soru bulamadım; başka bir konu dener misin?' : 'Şu an sorabileceğim bir soru bulamadım.');
      return { tur:'kart-yok' };
    }
    const soru = { id:String(q.id), konu:String(q.konu || ''), soru:String(q.soru), sec:q.sec.slice(0, 5).map(String),
      kaynak:String(q.kaynak || ''), not:String(q.not || ''), sorgu:n.konu || '' };
    soyle(soru.konu ? soru.konu + ' · soru' : 'Soru', null, null, null, { soru });
    return { tur:'kart-soru', id:soru.id };
  }
  async function soruCevapla(n, harf){
    const m = akis[n], K = ayar && ayar.kartlar;
    if(m && m.soru && !m.soru.cevap && /^kd:/.test(m.soru.id)){
      const c = kdCevapla(m, harf);
      if(!c) return null;
      cipler = [{ ad:'Bir soru daha', is:'oner-metin:derslerimden soru sor' }];
      sakla(); ciz(false);
      if(sesleMi()) seslendir(c.isabet ? 'Doğru.' : 'Doğru cevap ' + c.dogru + '.');
      return c;
    }
    if(!m || !m.soru || m.soru.cevap || !K || typeof K.cevapla !== 'function') return null;
    let r = null;
    try{ r = await K.cevapla(m.soru.id, harf); }catch(e){ r = null; }
    if(!r || !r.dogru){ soyle('Cevabı kaydedemedim; soruyu modülün kendi ekranında deneyebilirsin.'); return null; }
    m.soru.cevap = { harf, dogru:String(r.dogru), isabet:harf === r.dogru,
      cozum:(r.cozum || []).map(String).slice(0, 6), not:String(r.not || '') };
    cipler = [{ ad:'Bir soru daha', is:'soru-yeni:' + n }];
    /* Öğretmen: yanlışta, bu konunun dersi sohbetteyse yeniden anlatmayı öner. */
    const dn = m.soru.cevap.isabet ? -1 : dersBul(m.soru.sorgu);
    if(dn >= 0) cipler.unshift({ ad:'Konuyu yeniden anlat', is:'ders-tekrar:' + dn });
    sakla();
    ciz(false);
    if(sesleMi()) seslendir(m.soru.cevap.isabet ? 'Doğru.' : 'Doğru cevap ' + m.soru.cevap.dogru + '.');
    return m.soru.cevap;
  }
  /* ======================================================================
     DEVRİM (kullanıcı, 2026-10-22: «devrimsel bir şey»; belgeler/ekip/
     KING-DEVRIM.md). Üç yetenek, hepsinde sayıyı KOD üretir:
       1. Kişisel yasalar — modülün günlük ölçülerinden (kartlar.olcu)
          medyan bölmesi ve etki büyüklüğü; ilişki, neden değil.
       2. Günüm — modülün bugünkü maddeleri (kartlar.gun); şimdi, sırada,
          bitti; «Başlat» odak sayacını kurar. Yazma yok.
       3. Derse çevir — Merkez kaynaktan ders ve soru yazar; KOD her bölümün
          ve sorunun alıntısını kaynakta arar, bulamadığını atar.
     ====================================================================== */
  const YASA_RE = /(yasalarım|kişisel yasa|beni ne etkiliyor|bana ne iyi geliyor|neyin işe yaradığı)/;
  const YASA_GUN = 120, YASA_EN_AZ = 8, YASA_ETKI = 0.5;
  function gunGeri(n){
    const d = ortam.simdi();
    const g = new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
    return g.getFullYear() + '-' + String(g.getMonth() + 1).padStart(2, '0') + '-' + String(g.getDate()).padStart(2, '0');
  }
  const ortalama = l => l.reduce((a, b) => a + b, 0) / l.length;
  function medyan(l){ const s = l.slice().sort((a, b) => a - b), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; }
  /* Saf: { var, yasalar:[{ a, b, gecikme, esik, ust, alt, nUst, nAlt, etki }] }. */
  function yasaHesapla(olcu){
    if(!olcu || !Array.isArray(olcu.liste) || typeof olcu.deger !== 'function' || olcu.liste.length < 2)
      return { var:false, neden:olcu && Array.isArray(olcu.liste) && olcu.liste.length === 1 ? 'tek-olcu' : 'olcu-yok' };
    const gunler = [];
    for(let i = 1; i <= YASA_GUN; i++) gunler.push(gunGeri(i));            // [0] dün, en eskisi sonda
    const seri = {};
    olcu.liste.forEach(x => {
      seri[x.id] = gunler.map(g => { let v = null; try{ v = olcu.deger(x.id, g); }catch(e){ v = null; } return typeof v === 'number' && isFinite(v) ? v : null; });
    });
    const out = [];
    olcu.liste.forEach(A => olcu.liste.forEach(B => {
      if(A.id === B.id) return;
      [0, 1].forEach(gecikme => {
        const ciftler = [];
        for(let k = gecikme; k < gunler.length; k++){
          const a = seri[A.id][k], b = seri[B.id][k - gecikme];       // gecikme 1: B, A'nın ertesi günü
          if(a != null && b != null) ciftler.push([a, b]);
        }
        if(ciftler.length < 2 * YASA_EN_AZ) return;
        const esik = medyan(ciftler.map(c => c[0]));
        const ust = ciftler.filter(c => c[0] > esik).map(c => c[1]), alt = ciftler.filter(c => c[0] < esik).map(c => c[1]);
        if(ust.length < YASA_EN_AZ || alt.length < YASA_EN_AZ) return;
        const mU = ortalama(ust), mA = ortalama(alt);
        const v = l => { const m = ortalama(l); return l.reduce((s, x) => s + (x - m) * (x - m), 0) / (l.length - 1); };
        const sd = Math.sqrt(((ust.length - 1) * v(ust) + (alt.length - 1) * v(alt)) / (ust.length + alt.length - 2));
        if(!(sd > 0)) return;
        const etki = (mU - mA) / sd;
        if(Math.abs(etki) < YASA_ETKI) return;
        out.push({ a:A, b:B, gecikme, esik, ust:mU, alt:mA, nUst:ust.length, nAlt:alt.length, etki });
      });
    }));
    out.sort((x, y) => Math.abs(y.etki) - Math.abs(x.etki));
    return { var:true, yasalar:out.slice(0, 6), gun:YASA_GUN };
  }
  const sayiYaz = (x, d) => (Math.round(x * Math.pow(10, d == null ? 1 : d)) / Math.pow(10, d == null ? 1 : d)).toLocaleString('tr-TR');
  const birimli = (x, b) => sayiYaz(x) + (b ? ' ' + b : '');
  function yasaCumlesi(y){
    return y.a.ad + ' ' + birimli(y.esik, y.a.birim) + ' üstündeyken' + (y.gecikme ? ' ertesi gün ' : ' ') + y.b.ad.toLocaleLowerCase('tr')
      + ' ortalama ' + birimli(Math.abs(y.ust - y.alt), y.b.birim) + (y.ust > y.alt ? ' daha yüksek' : ' daha düşük') + '.';
  }
  function yasaIsle(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
    const K = ayar && ayar.kartlar, ad = MODUL_AD[ayar && ayar.modul] || 'Bu modül';
    const r = yasaHesapla(K && K.olcu);
    const capraz = baglanti() ? [{ ad:'Modüller arası', is:'oner-metin:çapraz bulgu' }] : [];
    if(!r.var){
      cipler = capraz.length ? capraz : null;
      soyle(r.neden === 'tek-olcu' ? ad + '’de tek bir günlük ölçü var; yasa için en az iki ölçü gerekir.' + (capraz.length ? ' Modüller arası bulguyu Merkez’den getirebilirim.' : '')
        : ad + ' günlük ölçü vermiyor; kişisel yasa çıkaramam.');
      return { tur:'yasa', n:0 };
    }
    if(!r.yasalar.length){
      cipler = capraz.length ? capraz : null;
      soyle('Son ' + r.gun + ' günde ' + ad + '’nin ölçüleri arasında belirgin bir bağ yok (ya da her grupta en az ' + YASA_EN_AZ + ' gün yok). Ölçtükçe yeniden bakarım.');
      return { tur:'yasa', n:0 };
    }
    cipler = capraz.length ? capraz : null;
    soyle('Senin yasaların · ' + ad, null, null, null, { yasa:{ gun:r.gun, l:r.yasalar.map(y => ({
      cumle:yasaCumlesi(y), ust:y.ust, alt:y.alt, nUst:y.nUst, nAlt:y.nAlt, birim:y.b.birim, aAd:y.a.ad, bAd:y.b.ad,
      deney:y.a.ad + ' ' + (y.ust > y.alt ? 'artınca' : 'azalınca') + ' ' + y.b.ad.toLocaleLowerCase('tr') + ' iyileşir mi' })) } });
    return { tur:'yasa', n:r.yasalar.length };
  }
  function yasaHtml(m, n){
    const y = m.yasa;
    if(!y) return '';
    return '<div class="king__yasa" role="list" aria-label="Kişisel yasalar">' + y.l.map((x, i) => {
      const en = Math.max(Math.abs(x.ust), Math.abs(x.alt)) || 1;
      const cubuk = (deger, ad) => '<span class="king__yasa-cubuk"><small>' + kac(ad) + '</small><i style="width:' + Math.max(4, Math.round(Math.abs(deger) / en * 100)) + '%"></i>'
        + '<b>' + kac(birimli(deger, x.birim)) + '</b></span>';
      return '<div class="king__yasa-s" role="listitem"><p>' + kac(x.cumle) + '</p>'
        + '<div class="king__yasa-cubuklar" role="img" aria-label="' + kac(x.aAd + ' üstünde ' + x.nUst + ' gün ortalama ' + birimli(x.ust, x.birim) + ', altında ' + x.nAlt + ' gün ortalama ' + birimli(x.alt, x.birim)) + '">'
        + cubuk(x.ust, 'üstünde · ' + x.nUst + ' gün') + cubuk(x.alt, 'altında · ' + x.nAlt + ' gün') + '</div>'
        + '<div class="king__yasa-alt"><small>hesaplandı · ilişki, neden değil · son ' + y.gun + ' gün</small>'
        + '<button type="button" class="king__cip" data-king="yasa-deney:' + n + ':' + i + '">Deneye çevir</button></div></div>';
    }).join('') + '</div>';
  }

  const GUN_RE = /^(günüm|günümü (?:göster|kur|planla)|günü kur|bugün ne yapayım|bugünkü planım|günüm nasıl)\s*[?.!]*$/;
  const GUN_KAPAT_RE = /^(günü kapat|günü bitir|gün sonu)\s*[?.!]*$/;
  const GUN_DURUM = ['bitti', 'simdi', 'sirada', 'atlandi'];
  function gunIsle(metin, kapat){
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
    const K = ayar && ayar.kartlar, ad = MODUL_AD[ayar && ayar.modul] || 'Bu modül';
    let g = null;
    try{ g = K && typeof K.gun === 'function' ? K.gun() : null; }catch(e){ g = null; }
    const yazi = (v, k) => String(v == null ? '' : v).trim().slice(0, k);
    const ogeler = (g && Array.isArray(g.ogeler) ? g.ogeler : []).filter(x => x && x.ad).slice(0, 12).map(x => ({
      ad:yazi(x.ad, 80), alt:yazi(x.alt, 80), durum:GUN_DURUM.indexOf(x.durum) >= 0 ? x.durum : 'sirada',
      dk:typeof x.dk === 'number' && x.dk > 0 ? Math.round(x.dk) : null, route:x.route ? String(x.route) : null }));
    if(!ogeler.length){
      soyle(g && g.not ? String(g.not) : ad + '’de bugün için planlanmış madde yok.');
      return { tur:'gun', n:0 };
    }
    let siradaki = ogeler.findIndex(x => x.durum === 'simdi');
    if(siradaki < 0) siradaki = ogeler.findIndex(x => x.durum === 'sirada');
    const bekleyenN = ogeler.filter(x => x.durum === 'sirada' || x.durum === 'simdi').length;
    const saat = ortam.simdi().getHours();
    /* Uyarlama kuraldır: akşam çok madde bekliyorsa modülün sırasıyla öne alınacak tek madde. */
    const not = kapat ? (bekleyenN ? bekleyenN + ' madde kaldı; yarına kalırlar, modülün planı onları yeniden dağıtır.' : 'Bugünün bütün maddeleri tamam.')
      : saat >= 18 && bekleyenN >= 3 ? 'Akşam oldu ve ' + bekleyenN + ' madde bekliyor; önce «' + ogeler[siradaki].ad + '».' : (g && g.not ? yazi(g.not, 160) : '');
    if(kapat) cipler = [{ ad:'Sesli özet', is:'oner-metin:sesli özet' }];
    soyle(kapat ? 'Günün kapanışı · ' + ad : 'Bugün · ' + ad, null, null, null, { gun:{ ogeler, siradaki:kapat ? -1 : siradaki, not, modul:ayar.modul } });
    return { tur:'gun', n:ogeler.length, siradaki };
  }
  const GUN_DURUM_AD = { bitti:'bitti', simdi:'şimdi', sirada:'sırada', atlandi:'atlandı' };
  function gunKartHtml(m, n){
    const g = m.gun;
    if(!g) return '';
    const bitti = g.ogeler.filter(x => x.durum === 'bitti').length;
    return '<div class="king__gunum">' + '<div class="king__ders-ilerleme">' + cubukHtml(Math.round(bitti * 100 / g.ogeler.length), bitti + ' / ' + g.ogeler.length + ' madde bitti')
      + '<small>' + bitti + ' / ' + g.ogeler.length + '</small></div>'
      + '<ol class="king__gunum-l">' + g.ogeler.map((x, i) => '<li class="king__gunum-s is-' + x.durum + (i === g.siradaki ? ' is-siradaki' : '') + '">'
        + '<i class="king__gunum-nokta" aria-hidden="true"></i><span class="king__gunum-ad"><b>' + kac(x.ad) + '</b>'
        + (x.alt || x.dk ? '<small>' + kac([x.alt, x.dk ? x.dk + ' dk' : ''].filter(Boolean).join(' · ')) + '</small>' : '') + '</span>'
        + '<span class="king__gunum-durum">' + (i === g.siradaki ? 'sıradaki' : GUN_DURUM_AD[x.durum]) + '</span>'
        + (i === g.siradaki ? '<span class="king__gunum-eylem"><button type="button" class="king__cip king__cip--ana" data-king="gun-baslat:' + n + ':' + i + '">Başlat</button>'
          + (x.route ? '<button type="button" class="king__cip" data-king="gun-ac:' + n + ':' + i + '">Modülde aç</button>' : '') + '</span>' : '')
        + '</li>').join('') + '</ol>'
      + (g.not ? '<p class="king__gunum-not">' + kac(g.not) + '</p>' : '') + '</div>';
  }

  const DERSLER = 'lifeos.king.dersler';
  const DERSE_RE = /^(?:bunu |bu belgeyi |belgeyi |pdf'?i )?derse çevir\s*:?\s*([\s\S]*)$/;
  const KD_SORU_RE = /derslerimden (?:bir )?soru/;
  const KD_ARALIK = [1, 3, 7];
  let kaynakMetin = null;                          // son PDF'in ya da yapıştırılan metnin kendisi (saklanmaz)
  function kdDersler(){ const l = ortam.depo.oku(DERSLER); return Array.isArray(l) ? l.filter(x => x && x.id && Array.isArray(x.bolumler)) : []; }
  function kdYaz(l){ ortam.depo.yaz(DERSLER, l.slice(0, 20)); }
  const kdNorm = s => kucuk(String(s || '')).replace(/[’'`´“”"«»]/g, '').replace(/\s+/g, ' ').trim();
  function kdDogrula(alinti, kaynakN){
    const a = kdNorm(alinti);
    return a.length >= 20 && a.length <= 500 && kaynakN.indexOf(a) >= 0;
  }
  function kdJson(metin){
    const s = String(metin || ''), i = s.indexOf('{'), j = s.lastIndexOf('}');
    if(i < 0 || j <= i) return null;
    try{ return JSON.parse(s.slice(i, j + 1)); }catch(e){ return null; }
  }
  /* Saf: modelin JSON'u + kaynak metin → doğrulanmış ders ya da { hata }. */
  function kdKur(j, kaynak, ad){
    const kn = kdNorm(kaynak);
    const yazi = (v, k) => String(v == null ? '' : v).trim().slice(0, k);
    if(!j || typeof j !== 'object') return { hata:'Merkez ders biçiminde cevap vermedi.' };
    const bolumler = (Array.isArray(j.bolumler) ? j.bolumler : []).filter(b => b && b.metin && kdDogrula(b.alinti, kn)).slice(0, 8)
      .map(b => ({ baslik:yazi(b.baslik, 100) || 'Bölüm', metin:yazi(b.metin, 1400), liste:[], dikkat:'', alinti:yazi(b.alinti, 500) }));
    const sorular = (Array.isArray(j.sorular) ? j.sorular : []).filter(q => q && q.soru && Array.isArray(q.secenekler)
      && q.secenekler.length >= 3 && q.secenekler.length <= 5 && 'ABCDE'.slice(0, q.secenekler.length).indexOf(String(q.dogru || '').toUpperCase()) >= 0
      && kdDogrula(q.alinti, kn)).slice(0, 10)
      .map(q => ({ soru:yazi(q.soru, 400), sec:q.secenekler.map(x => yazi(x, 160)), dogru:String(q.dogru).toUpperCase(), alinti:yazi(q.alinti, 500) }));
    const atilan = (Array.isArray(j.bolumler) ? j.bolumler.length : 0) - bolumler.length;
    if(bolumler.length < 2) return { hata:'Kaynakla doğrulanabilen bölüm çıkmadı (alıntılar metinde bulunamadı); ders kurmadım.' };
    return { ders:{ id:'kd' + ortam.simdi().getTime(), baslik:yazi(j.baslik, 100) || ad, kaynak:yazi(ad, 120), zaman:ortam.simdi().toISOString(),
      bolumler, sorular, tekrar:{} }, atilan };
  }
  function kdDersMesaji(d){
    return { id:d.id, baslik:d.baslik, alt:'Kaynak: ' + d.kaynak, giris:'', etiket:'Merkez yazdı · her bölüm kaynaktan alıntıyla doğrulandı',
      sorgu:'kd:' + d.id, soruVar:d.sorular.length > 0, acilir:false, bolumler:d.bolumler, adim:0, kd:true };
  }
  async function derseCevir(metin, kaynakAd){
    const kaynak = String(metin || '').trim();
    if(kaynak.length < 400){ soyle('Derse çevirmek için en az bir paragraflık kaynak gerekir: bir PDF ver ya da «derse çevir:» deyip metni yapıştır.'); return { tur:'kd', n:0 }; }
    if(!baglanti()){ soyle('Dersi Merkez’deki model yazar, kod kaynağa karşı doğrular; Merkez bağlı değil.'); return { tur:'kd', n:0 }; }
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek); ciz(false);
    const r = await merkezeSor('Aşağıdaki KAYNAK METİN’den Türkçe kısa bir ders kur. YALNIZ JSON döndür, başka hiçbir şey yazma:\n'
      + '{"baslik":"…","bolumler":[{"baslik":"…","metin":"2-4 cümle anlatım","alinti":"kaynaktan AYNEN kopyalanmış bir cümle"}],'
      + '"sorular":[{"soru":"…","secenekler":["…","…","…","…"],"dogru":"A","alinti":"cevabın geçtiği cümle, kaynaktan AYNEN"}]}\n'
      + '3-6 bölüm, 3-6 soru. Her «alinti» kaynakta harfi harfine geçmeli; kaynakta olmayan bilgi ve sayı yazma.\n\nKAYNAK METİN:\n' + kaynak.slice(0, PDF_METIN),
      bek, { araclar:false });
    akis = akis.filter(m => m !== bek);
    if(!r.ok){ soyle('Merkez’e ulaşılamadı; ders kurulamadı.'); return { tur:'kd', n:0 }; }
    const k = kdKur(kdJson(r.text), kaynak, kaynakAd || 'yapıştırılan metin');
    if(k.hata){ soyle(k.hata); return { tur:'kd', n:0 }; }
    kdYaz([k.ders].concat(kdDersler()));
    cipler = k.ders.sorular.length ? [{ ad:'Bu dersten soru sor', is:'oner-metin:derslerimden soru sor' }] : null;
    soyle(k.ders.baslik + ' · ders' + (k.atilan > 0 ? ' (' + k.atilan + ' bölüm kaynakta doğrulanamadığı için atıldı)' : ''), null, null, null, { ders:kdDersMesaji(k.ders) });
    return { tur:'kd', n:k.ders.bolumler.length, soru:k.ders.sorular.length };
  }
  /* Derslerden sıradaki soru: vadesi gelen (yanlış 1, doğru 3 ve 7 gün), yoksa hiç sorulmamış. */
  function kdSoru(dersId){
    const bugun = bugunISO();
    const l = kdDersler().filter(d => !dersId || d.id === dersId);
    let sec = null;
    l.forEach(d => d.sorular.forEach((q, i) => {
      const tk = d.tekrar[i];
      const puan = tk ? (tk.bitti ? -1 : String(tk.sonraki) <= bugun ? 2 : -1) : 1;
      if(puan > 0 && (!sec || puan > sec.puan)) sec = { d, i, q, puan };
    }));
    if(!sec){ soyle(l.length ? 'Derslerinde şu an sorulacak soru yok; vadesi gelince sorarım.' : 'Henüz dersin yok. Bir PDF ver ya da «derse çevir:» deyip metin yapıştır.'); return { tur:'kd-soru', n:0 }; }
    const soru = { id:'kd:' + sec.d.id + ':' + sec.i, konu:sec.d.baslik, soru:sec.q.soru, sec:sec.q.sec, kaynak:'Kaynak: ' + sec.d.kaynak, not:'', sorgu:'kd:' + sec.d.id };
    soyle(sec.d.baslik + ' · soru', null, null, null, { soru });
    return { tur:'kd-soru', id:soru.id };
  }
  function kdCevapla(m, harf){
    const p = m.soru.id.split(':'), l = kdDersler(), d = l.find(x => x.id === p[1]), i = Number(p[2]), q = d && d.sorular[i];
    if(!q) return null;
    const isabet = harf === q.dogru, tk = d.tekrar[i];
    let not = '';
    if(!isabet){ d.tekrar[i] = { n:0, sonraki:gunIleri(KD_ARALIK[0]) }; not = 'Yarın bu soruyu yeniden soracağım.'; }
    else{
      const n = tk ? tk.n + 1 : 1;
      if(n >= KD_ARALIK.length){ d.tekrar[i] = { n, bitti:true }; not = 'Tekrarları tamamladın.'; }
      else{ d.tekrar[i] = { n, sonraki:gunIleri(KD_ARALIK[n]) }; not = KD_ARALIK[n] + ' gün sonra bir kez daha soracağım.'; }
    }
    kdYaz(l);
    m.soru.cevap = { harf, dogru:q.dogru, isabet, cozum:['Kaynakta: «' + q.alinti + '»'], not };
    return m.soru.cevap;
  }
  function gunIleri(n){
    const d = ortam.simdi();
    const g = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    return g.getFullYear() + '-' + String(g.getMonth() + 1).padStart(2, '0') + '-' + String(g.getDate()).padStart(2, '0');
  }

  /* ======================================================================
     ARAÇ KUTUSU (kullanıcı, 2026-10-23: «araçları bir sürü arttır, güzel işe
     yarayan şeyler»). Hepsi cihazda, modelsiz; sonucu KOD hesaplar:
       hesapla        «hesapla: 15*4+2», yüzde «200*%15» — eval yok, küçük ayrıştırıcı
       birim çevir    «5 km kaç mil», «70 kg kaç lb», «30 c kaç f», «90 dk kaç saat»
       tarih          «45 gün sonra hangi gün», «19 haziran kaç gün kaldı»
       yapılacaklar   «yapılacak: fatura öde», «yapılacaklarım» (TASINAN'da)
       hatırlatıcı    «20 dakika sonra hatırlat: çamaşır», «saat 18:30 hatırlat: ilaç»
                      sayfa açıkken zamanında bildirim; kapalıyken açılınca söyler
       karar ver      «karar ver: pizza, makarna, çorba»
       nefes          «nefes egzersizi» — kutu nefesi (4 al, 4 tut, 4 ver, 4 tut)
     ====================================================================== */
  const sayiTr = v => (Math.round(v * 1e8) / 1e8).toLocaleString('tr-TR', { maximumFractionDigits:8 });
  const HESAP_RE = /^(?:hesapla|hesap et|hesap)\s*:?\s*(.+?)\s*(?:=|\?|kaç eder|kaç)?\s*$/;
  /* Saf: «15*4+2» → 62; geçersizse null. Toplama, çıkarma, çarpma, bölme, üs (^), parantez, sondaki % (yüzde). */
  function hesapla(s){
    const t = String(s || '').replace(/(\d)\s*[x×]\s*(?=[\d(])/g, '$1*').replace(/÷|:/g, '/').replace(/,/g, '.').replace(/\s+/g, '');
    if(!t || t.length > 120 || !/^[\d.+\-*/^%()]+$/.test(t)) return null;
    let i = 0;
    const sayi = () => { const m = t.slice(i).match(/^\d+(?:\.\d+)?/); if(!m) throw new Error('sayı'); i += m[0].length; return Number(m[0]); };
    const birim = () => {
      if(t[i] === '-'){ i++; return -birim(); }
      if(t[i] === '+'){ i++; return birim(); }
      if(t[i] === '%'){ i++; return birim() / 100; }        // Türkçe yazım: %18
      let v;
      if(t[i] === '('){ i++; v = toplam(); if(t[i] !== ')') throw new Error(')'); i++; }
      else v = sayi();
      while(t[i] === '%'){ i++; v /= 100; }
      return v;
    };
    const us = () => { const v = birim(); if(t[i] === '^'){ i++; return Math.pow(v, us()); } return v; };
    const carpim = () => { let v = us(); while(t[i] === '*' || t[i] === '/'){ const o = t[i++], w = us(); v = o === '*' ? v * w : v / w; } return v; };
    const toplam = () => { let v = carpim(); while(t[i] === '+' || t[i] === '-'){ const o = t[i++], w = carpim(); v = o === '+' ? v + w : v - w; } return v; };
    try{ const v = toplam(); return i === t.length && isFinite(v) ? v : null; }catch(e){ return null; }
  }
  const BIRIM = (() => {
    const b = {};
    const ekle = (tur, carpan, ...adlar) => adlar.forEach(a => { b[a] = { tur, carpan, ad:adlar[0] }; });
    ekle('uzunluk', 1000, 'km', 'kilometre'); ekle('uzunluk', 1, 'm', 'metre'); ekle('uzunluk', 0.01, 'cm', 'santim', 'santimetre');
    ekle('uzunluk', 0.001, 'mm', 'milimetre'); ekle('uzunluk', 1609.344, 'mil'); ekle('uzunluk', 0.3048, 'ft', 'fit', 'feet', 'ayak');
    ekle('uzunluk', 0.0254, 'inç', 'inc', 'inch'); ekle('uzunluk', 0.9144, 'yarda', 'yard');
    ekle('kütle', 1, 'g', 'gram'); ekle('kütle', 1000, 'kg', 'kilo', 'kilogram'); ekle('kütle', 0.001, 'mg', 'miligram');
    ekle('kütle', 453.59237, 'lb', 'libre', 'pound'); ekle('kütle', 28.349523125, 'ons', 'oz'); ekle('kütle', 1e6, 'ton');
    ekle('hacim', 1, 'l', 'lt', 'litre'); ekle('hacim', 0.001, 'ml', 'mililitre'); ekle('hacim', 3.785411784, 'galon', 'gal');
    ekle('süre', 1, 'sn', 'saniye'); ekle('süre', 60, 'dk', 'dakika'); ekle('süre', 3600, 'sa', 'saat');
    ekle('süre', 86400, 'gün'); ekle('süre', 604800, 'hafta');
    ekle('sıcaklık', 'c', 'c', '°c', 'santigrat', 'derece'); ekle('sıcaklık', 'f', 'f', '°f', 'fahrenhayt', 'fahrenheit'); ekle('sıcaklık', 'k', 'k', 'kelvin');
    return b;
  })();
  const BIRIM_RE = /^(-?\d+(?:[.,]\d+)?)\s*([a-zçğıöşü°]+)\s+(?:kaç|ne kadar|=|->|eşittir)\s*([a-zçğıöşü°]+)\s*(?:eder|yapar)?\s*\??$/;
  /* Saf: (5, 'km', 'mil') → { deger, a, b } ya da null (bilinmeyen ya da farklı tür). */
  function birimCevir(v, a, b){
    const x = BIRIM[a], y = BIRIM[b];
    if(!x || !y || x.tur !== y.tur) return null;
    if(x.tur === 'sıcaklık'){
      const c = x.carpan === 'c' ? v : x.carpan === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
      return { deger:y.carpan === 'c' ? c : y.carpan === 'f' ? c * 9 / 5 + 32 : c + 273.15, a:x.ad.toUpperCase(), b:y.ad.toUpperCase() };
    }
    return { deger:v * x.carpan / y.carpan, a:x.ad, b:y.ad };
  }
  const AYLAR = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
  const GUNLER = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
  const TARIH_ILERI_RE = /^(\d{1,4})\s*(gün|hafta|ay)\s*(sonra|önce)(?:\s*(?:hangi gün|hangi tarih|ne zaman|günlerden ne))?\s*\??$/;
  const TARIH_KALAN_RE = new RegExp('^(\\d{1,2})\\s+(' + AYLAR.join('|') + ')(?:\\s+(\\d{4}))?\\S*\\s+(?:kaç gün|ne kadar)');
  const tarihYazTr = d => d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear() + ', ' + GUNLER[d.getDay()];
  function gunFarki(a, b){ return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }

  const YAP = 'lifeos.king.yapilacak';
  const YAP_EKLE_RE = /^(?:yapılacak|yapılacaklara ekle|listeye ekle|todo)\s*:\s*(.+)$/;
  const YAP_LISTE_RE = /^(yapılacaklar(?:ım)?|yapılacak listem|listem)\s*[?.!]*$/;
  const YAP_TEMIZ_RE = /^(yapılanları|bitenleri|yapılacakları) temizle\s*[.!]*$/;
  function yapilacaklar(){ const l = ortam.depo.oku(YAP); return Array.isArray(l) ? l.filter(x => x && x.id && x.metin) : []; }
  function yapYaz(l){ if(l.length) ortam.depo.yaz(YAP, l.slice(-60)); else ortam.depo.sil(YAP); }
  function yapHtml(m){
    if(!m.yap) return '';
    const l = yapilacaklar();
    if(!l.length) return '<p class="king__gunum-not">Liste boş. «yapılacak: …» diye ekle.</p>';
    return '<ul class="king__yap">' + l.map(x => '<li><button type="button" class="king__yap-is' + (x.bitti ? ' is-bitti' : '') + '" data-king="yap:' + kac(x.id)
      + '" aria-pressed="' + (x.bitti ? 'true' : 'false') + '"><i aria-hidden="true"></i><span>' + kac(x.metin) + '</span></button></li>').join('') + '</ul>';
  }

  const HATIR = 'lifeos.king.hatirlat';
  const HATIR_SURE_RE = /^(\d{1,3})\s*(dk|dakika|sa|saat)\s*sonra\s*(?:bana\s*)?(?:hatırlat|haber ver|söyle)\s*:?\s*(.*)$/;
  const HATIR_SAAT_RE = /^saat\s*(\d{1,2})[:.](\d{2})\S*\s*(?:bana\s*)?(?:hatırlat|haber ver)\s*:?\s*(.*)$/;
  const HATIR_LISTE_RE = /^hatırlatma(?:larım|lar)\s*[?.!]*$/;
  let hatirSaat = null;
  function hatirlatmalar(){ const l = ortam.depo.oku(HATIR); return Array.isArray(l) ? l.filter(x => x && x.id && x.zaman) : []; }
  function hatirYaz(l){ if(l.length) ortam.depo.yaz(HATIR, l.slice(-30)); else ortam.depo.sil(HATIR); }
  /* Vadesi gelenleri söyler; en yakını için tek zamanlayıcı kurar (gerçek setTimeout: sınama sahte zamanlamayı kullanmaz). */
  function hatirlatKur(){
    if(hatirSaat){ try{ clearTimeout(hatirSaat); }catch(e){ /* yok */ } hatirSaat = null; }
    const simdi = ortam.simdi().getTime(), l = hatirlatmalar();
    const gelen = l.filter(x => Date.parse(x.zaman) <= simdi);
    if(gelen.length){
      hatirYaz(l.filter(x => gelen.indexOf(x) < 0));
      gelen.forEach(x => {
        ortam.bildir('LifeOS · hatırlatma', x.metin);
        if(acik) soyle('Hatırlatma: ' + x.metin);
        else{ akis.push({ kim:'king', metin:'Hatırlatma: ' + x.metin }); sakla(); }
      });
    }
    const sonraki = hatirlatmalar().map(x => Date.parse(x.zaman)).sort((a, b) => a - b)[0];
    if(sonraki && typeof setTimeout === 'function' && sonraki - simdi < 864e5) hatirSaat = setTimeout(hatirlatKur, Math.max(1000, sonraki - simdi));
  }
  const KARAR_RE = /^(?:rastgele seç|karar ver|birini seç|seç)\s*:\s*(.+)$/;
  function rastgele(n){
    try{ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }catch(e){ return Math.floor(Math.random() * n); }
  }
  const NEFES_RE = /^(nefes egzersizi|kutu nefesi|nefes alalım|nefes çalışması|sakinleşmem lazım)\s*[?.!]*$/;
  function nefesHtml(m){
    if(!m.nefes) return '';
    return '<div class="king__nefes" role="img" aria-label="Kutu nefesi: 4 saniye al, 4 tut, 4 ver, 4 tut; dört tur">'
      + '<span class="king__nefes-daire" aria-hidden="true"></span>'
      + '<span class="king__nefes-yazi" aria-hidden="true"><b>Al</b><b>Tut</b><b>Ver</b><b>Tut</b></span>'
      + '<small>4 al · 4 tut · 4 ver · 4 tut · dört tur, yaklaşık bir dakika</small></div>';
  }
  const ZAR_RE = /^(?:([1-6])\s*)?zar at\s*[?.!]*$/;
  const YT_RE = /^(?:yazı tura(?: at)?|yazı mı tura mı|para at)\s*[?.!]*$/;
  const SAYI_RE = /^(-?\d+)\s*(?:ile|ila|-)\s*(-?\d+)\s*arası(?:nda)?\s*(?:rastgele\s*)?(?:bir\s*)?sayı(?:\s*(?:seç|tut|ver|söyle))?\s*[?.!]*$/;
  const BOL_RE = /^(?:hesabı böl|hesap böl)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:tl|₺)?\s*(?:\/|kişiye|,)\s*(\d+)\s*(?:kişi(?:ye)?)?\s*$/;
  const KELIME_RE = /^(?:kelime say|kelimeleri say|karakter say)\s*:\s*([\s\S]+)$/i;
  const YAS_RE = /^yaş hesapla\s*:?\s*(\d{1,2})[./](\d{1,2})[./](\d{4})\s*$|^(\d{1,2})[./](\d{1,2})[./](\d{4})\s*(?:doğumluyum|doğumlu)?\s*(?:kaç yaşındayım|yaşım kaç)\s*[?.!]*$/;
  const VKI_RE = /^(?:vki|bmi|beden kitle(?: indeksi)?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*kg\s*(\d+(?:[.,]\d+)?)\s*(cm|m)\s*$/;
  const SIFRE_RE = /^(?:şifre üret|parola üret|güçlü şifre(?: üret)?)\s*(\d{1,2})?\s*[?.!]*$/;
  const KART_YAP_RE = /^(?:kart yap|karta ekle|kart olarak (?:ekle|kaydet))\s*:\s*([\s\S]+)$/i;
  const sayiNo = x => Number(String(x).replace(',', '.'));
  /* Tek giriş: anlaşılırsa sonucu döner, değilse null (mesaj olağan yoluna gider). */
  function aracKutusu(metin, t0){
    const sen = () => { akis.push({ kim:'sen', metin:String(metin).trim() }); bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null; };
    let m = t0.match(HESAP_RE);
    if(m){
      const v = hesapla(m[1]);
      if(v != null){ sen(); soyle(m[1].trim() + ' = ' + sayiTr(v), null, null, 'hesaplandı · cihazda, modelsiz'); return { tur:'hesap', deger:v }; }
    }
    m = t0.match(BIRIM_RE);
    if(m){
      const r = birimCevir(Number(m[1].replace(',', '.')), m[2], m[3]);
      if(r){ sen(); soyle(sayiTr(Number(m[1].replace(',', '.'))) + ' ' + r.a + ' = ' + sayiTr(r.deger) + ' ' + r.b, null, null, 'hesaplandı'); return { tur:'birim', deger:r.deger }; }
    }
    m = t0.match(TARIH_ILERI_RE);
    if(m){
      const n = Number(m[1]) * (m[3] === 'önce' ? -1 : 1), d = ortam.simdi();
      const h = m[2] === 'ay' ? new Date(d.getFullYear(), d.getMonth() + n, d.getDate()) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + n * (m[2] === 'hafta' ? 7 : 1));
      sen(); soyle(m[1] + ' ' + m[2] + ' ' + m[3] + ': ' + tarihYazTr(h)); return { tur:'tarih', iso:h.toISOString().slice(0, 10) };
    }
    m = t0.match(TARIH_KALAN_RE);
    if(m){
      const bugun = ortam.simdi(), ay = AYLAR.indexOf(m[2]);
      let h = new Date(m[3] ? Number(m[3]) : bugun.getFullYear(), ay, Number(m[1]));
      if(!m[3] && gunFarki(bugun, h) < 0) h = new Date(bugun.getFullYear() + 1, ay, Number(m[1]));
      const g = gunFarki(bugun, h);
      sen(); soyle(tarihYazTr(h) + ': ' + (g > 0 ? g + ' gün kaldı (' + Math.floor(g / 7) + ' hafta ' + (g % 7) + ' gün).' : g === 0 ? 'bugün.' : (-g) + ' gün geçti.'));
      return { tur:'tarih', gun:g };
    }
    m = String(metin || '').trim().match(YAP_EKLE_RE);
    if(m){
      const l = yapilacaklar();
      const yeni = m[1].split(/\s*;\s*/).map(x => x.trim()).filter(Boolean).slice(0, 10)
        .map((x, i) => ({ id:'y' + ortam.simdi().getTime().toString(36) + i, metin:x.slice(0, 160), bitti:false }));
      yapYaz(l.concat(yeni)); sen();
      soyle(yeni.length === 1 ? 'Listeye ekledim.' : yeni.length + ' madde ekledim.', null, null, null, { yap:true });
      return { tur:'yap', n:yeni.length };
    }
    if(YAP_LISTE_RE.test(t0)){ sen(); soyle('Yapılacaklar · ' + yapilacaklar().filter(x => !x.bitti).length + ' açık', null, null, null, { yap:true }); return { tur:'yap', n:yapilacaklar().length }; }
    if(YAP_TEMIZ_RE.test(t0)){ const l = yapilacaklar(); yapYaz(l.filter(x => !x.bitti)); sen(); soyle((l.length - yapilacaklar().length) + ' biten maddeyi sildim.', null, null, null, { yap:true }); return { tur:'yap' }; }
    m = t0.match(HATIR_SURE_RE) || t0.match(HATIR_SAAT_RE);
    if(m){
      const d = ortam.simdi();
      let z;
      if(m.length === 4 && /^(dk|dakika|sa|saat)$/.test(m[2])) z = new Date(d.getTime() + Number(m[1]) * (/^(sa|saat)$/.test(m[2]) ? 3600000 : 60000));
      else{ z = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(m[1]), Number(m[2])); if(z <= d) z = new Date(z.getTime() + 864e5); }
      const ne = (m[3] || '').trim() || 'Hatırlatma';
      if(!(Number(m[1]) > 0 || m.length === 4 && !/^(dk|dakika|sa|saat)$/.test(m[2])) || isNaN(z)){ return null; }
      hatirYaz(hatirlatmalar().concat([{ id:'h' + d.getTime().toString(36), zaman:z.toISOString(), metin:ne.slice(0, 160) }]));
      sen(); soyle('Tamam, ' + String(z.getHours()).padStart(2, '0') + ':' + String(z.getMinutes()).padStart(2, '0') + (z.getDate() !== d.getDate() ? ' (yarın)' : '')
        + '’de hatırlatacağım: ' + ne + '. Sayfa açıksa bildirim gelir; kapalıysa açtığında söylerim.');
      hatirlatKur();
      return { tur:'hatirlat' };
    }
    if(HATIR_LISTE_RE.test(t0)){
      const l = hatirlatmalar().sort((a, b) => String(a.zaman).localeCompare(String(b.zaman)));
      sen(); cipler = l.slice(0, 4).map(x => ({ ad:'İptal: ' + x.metin.slice(0, 18), is:'hat-sil:' + x.id }));
      soyle(l.length ? l.length + ' hatırlatma bekliyor:' : 'Bekleyen hatırlatma yok.', l.map(x => tarihYaz(x.zaman) + ' · ' + x.metin));
      return { tur:'hatirlat', n:l.length };
    }
    m = String(metin || '').trim().match(KARAR_RE);
    if(m){
      const l = m[1].split(/\s*(?:,|;|\bya da\b|\bveya\b|\byoksa\b)\s*/).map(x => x.trim()).filter(Boolean);
      if(l.length >= 2){
        sen(); cipler = [{ ad:'Yeniden seç', is:'oner-metin:' + String(metin).trim() }];
        soyle('Seçtim: ' + l[rastgele(l.length)] + '.', null, null, 'rastgele, ' + l.length + ' seçenek arasından');
        return { tur:'karar' };
      }
    }
    if(NEFES_RE.test(t0)){ sen(); soyle('Kutu nefesi: daireyle birlikte nefes al, tut, ver, tut.', null, null, null, { nefes:true }); return { tur:'nefes' }; }
    m = t0.match(ZAR_RE);
    if(m){
      const n = Number(m[1] || 1), l = Array.from({ length:n }, () => rastgele(6) + 1);
      sen(); cipler = [{ ad:'Yeniden at', is:'oner-metin:' + n + ' zar at' }];
      soyle(n === 1 ? 'Zar: ' + l[0] + '.' : n + ' zar: ' + l.join(' + ') + ' = ' + l.reduce((a, b) => a + b, 0) + '.', null, null, 'rastgele');
      return { tur:'zar', l };
    }
    if(YT_RE.test(t0)){ sen(); cipler = [{ ad:'Yeniden at', is:'oner-metin:yazı tura' }]; soyle(rastgele(2) ? 'Yazı.' : 'Tura.', null, null, 'rastgele'); return { tur:'yazitura' }; }
    m = t0.match(SAYI_RE);
    if(m){
      const a = Math.min(Number(m[1]), Number(m[2])), b = Math.max(Number(m[1]), Number(m[2]));
      if(b - a <= 1e9){ sen(); cipler = [{ ad:'Yeniden seç', is:'oner-metin:' + a + ' ile ' + b + ' arası sayı' }]; soyle(a + ' ile ' + b + ' arasında: ' + (a + rastgele(b - a + 1)) + '.', null, null, 'rastgele'); return { tur:'sayi' }; }
    }
    m = t0.match(BOL_RE);
    if(m && Number(m[2]) > 0){
      const v = sayiNo(m[1]) / Number(m[2]);
      sen(); soyle(sayiTr(sayiNo(m[1])) + ' ÷ ' + m[2] + ' kişi = kişi başı ' + sayiTr(Math.round(v * 100) / 100) + '.', null, null, 'hesaplandı');
      return { tur:'bol', deger:v };
    }
    m = String(metin || '').trim().match(KELIME_RE);
    if(m){
      const y = m[1].trim(), kel = (y.match(/\S+/g) || []).length, kar = [...y].length, bos = [...y.replace(/\s/g, '')].length;
      const dk = kel / 200;
      sen(); soyle(kel + ' kelime, ' + kar + ' karakter (boşluksuz ' + bos + '). Okuma süresi yaklaşık ' + (dk < 1 ? Math.max(1, Math.round(dk * 60)) + ' saniye' : Math.round(dk) + ' dakika') + '.',
        null, null, 'hesaplandı · okuma dakikada 200 kelimeyle tahmin');
      return { tur:'kelime', kelime:kel };
    }
    m = t0.match(YAS_RE);
    if(m){
      const g = Number(m[1] || m[4]), a = Number(m[2] || m[5]) - 1, y = Number(m[3] || m[6]), d = new Date(y, a, g), b = ortam.simdi();
      if(d.getMonth() === a && d <= b){
        let yas = b.getFullYear() - y;
        if(b.getMonth() < a || (b.getMonth() === a && b.getDate() < g)) yas--;
        let son = new Date(b.getFullYear(), a, g);
        if(gunFarki(b, son) < 0) son = new Date(b.getFullYear() + 1, a, g);
        const kalan = gunFarki(b, son);
        sen(); soyle(yas + ' yaşındasın. ' + (kalan === 0 ? 'Doğum günün bugün, kutlu olsun!' : 'Doğum gününe ' + kalan + ' gün var.') + ' Bugüne kadar ' + sayiTr(gunFarki(d, b)) + ' gün.', null, null, 'hesaplandı');
        return { tur:'yas', yas };
      }
    }
    m = t0.match(VKI_RE);
    if(m){
      const kg = sayiNo(m[1]), boy = sayiNo(m[2]) / (m[3] === 'cm' ? 100 : 1);
      if(kg > 0 && boy > 0.5 && boy < 2.6){
        const v = Math.round(kg / (boy * boy) * 10) / 10;
        const ar = v < 18.5 ? 'zayıf (18,5 altı)' : v < 25 ? 'normal (18,5–24,9)' : v < 30 ? 'fazla kilolu (25–29,9)' : 'obez (30 ve üstü)';
        sen(); soyle('VKİ ' + sayiTr(v) + ': DSÖ aralığında ' + ar + '. VKİ kas ve yağı ayırmaz; tek başına sağlık ölçüsü değildir.', null, null, 'hesaplandı · kg / boy²');
        return { tur:'vki', deger:v };
      }
    }
    m = t0.match(SIFRE_RE);
    if(m){
      const n = Math.min(64, Math.max(8, Number(m[1] || 16))), H = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?-_';
      const sf = Array.from({ length:n }, () => H[rastgele(H.length)]).join('');
      sen(); cipler = [{ ad:'Yenisini üret', is:'oner-metin:şifre üret ' + n }];
      soyle(sf, ['Cihazda üretildi, hiçbir yere gönderilmedi. Sohbette kalır; kullandıktan sonra sohbeti silebilirsin.'], null, 'rastgele · ' + n + ' karakter');
      return { tur:'sifre', n };
    }
    m = String(metin || '').trim().match(KART_YAP_RE);
    if(m){
      const mt = m[1].trim(), ad = mt.split(/\s+/).slice(0, 4).join(' ').replace(/[,.;:!?]+$/, '');
      kartEkle(ad.length > 28 ? ad.slice(0, 27) + '…' : ad, mt, true);
      sen(); cipler = [{ ad:'Kartlarımı aç', is:'bolum:araclar' }];
      soyle('Kartlarım’a ekledim: «' + ad + '». Dokununca bu cümleyi sorar; rengini ve simgesini Araçlar › Düzenle’den seçersin.');
      return { tur:'kart' };
    }
    return null;
  }

  /* ---------- K4 (kullanıcı, 2026-10-22): MERKEZ SIRASI ve SESLİ ÖZET ----------
     Merkez'e ulaşılamadığında (telefon dışarıda) Merkez'e giden soru
     kaybolmaz: cihazda sıraya girer (lifeos.king.merkez-sira; TASINAN'da,
     modül değişse de taşınır). King açılınca, cihaz yeniden çevrimiçi olunca
     ve King açıkken dakikada bir yoklanır; Merkez'e ulaşınca sıra eskiden
     yeniye sorulur ve cevap sohbete «sıradan» diye düşer. Sırada en çok 20
     soru; 7 günden eskisi sorulmaz. Yalnız Merkez'e giden soru sıraya girer:
     yerel kuralla cevaplanan ve kayıt olan cümle girmez. Merkez hiç
     kurulmamışsa bekleyecek bir şey yoktur, sıra da yoktur.
     SESLİ ÖZET: «sesli özet», «günümü özetle» → modülün günlük cümleleri ve
     değeri olan kartları (sayıyı modül üretir, etiketiyle) sesli okunur,
     Kütüphane › Sesli özetler'de kalır (son 20). */
  const SIRA = 'lifeos.king.merkez-sira';
  const SIRA_EN_COK = 20, SIRA_GUN = 7;
  let siradanSoru = null, siraCalisiyor = false, siraSaat = null;
  function sira(){
    const l = ortam.depo.oku(SIRA), sinir = ortam.simdi().getTime() - SIRA_GUN * 864e5;
    return (Array.isArray(l) ? l : []).filter(x => x && x.metin && Date.parse(x.zaman) >= sinir);
  }
  function siraYaz(l){ if(l.length) ortam.depo.yaz(SIRA, l.slice(-SIRA_EN_COK)); else ortam.depo.sil(SIRA); }
  /* Sıradan sorulan yine ulaşamazsa başa geri döner, zamanı korunur. */
  function siraEkle(metin){
    const l = sira();
    if(siradanSoru) l.unshift(siradanSoru);
    else l.push({ metin:String(metin).trim(), zaman:ortam.simdi().toISOString(), modul:ayar && ayar.modul });
    siraYaz(l);
    return sira().length;
  }
  async function siraBosalt(){
    if(siraCalisiyor || !acik || !baglanti() || !sira().length) return 0;
    siraCalisiyor = true;
    let n = 0;
    try{
      while(sira().length){
        const x = sira()[0];
        siraYaz(sira().slice(1));
        siradanSoru = x;
        const r = await isle(x.metin);
        siradanSoru = null;
        if(r && r.tur === 'sira') break;                   // hâlâ ulaşılamıyor; başa döndü
        n++;
      }
    }finally{ siraCalisiyor = false; siradanSoru = null; }
    return n;
  }
  function siraPlanla(){
    if(siraSaat){ try{ clearInterval(siraSaat); }catch(e){ /* yok */ } siraSaat = null; }
    if(typeof setInterval !== 'function' || !sira().length) return;
    siraSaat = setInterval(() => { if(!acik || !sira().length){ clearInterval(siraSaat); siraSaat = null; return; } siraBosalt(); }, 60000);
  }
  const SOZET = 'lifeos.king.sesli-ozet';
  const SOZET_RE = /(sesli özet|günü(?:mü)? özetle|özetimi (?:oku|söyle)|günün özetini (?:oku|söyle)|bana günümü anlat)/;
  function sozetler(){ const l = ortam.depo.oku(SOZET); return Array.isArray(l) ? l.filter(x => x && Array.isArray(x.satirlar)) : []; }
  function sozetMetni(x){ return [(MODUL_AD[x.modul] || '') + '’de ' + tarihYaz(x.zaman)].concat(x.satirlar).join('. '); }
  function sesliOzet(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
    const K = ayar && ayar.kartlar, ad = MODUL_AD[ayar && ayar.modul] || 'Bu modül';
    let kart = [];
    try{ kart = (K && typeof K.istatistik === 'function' ? K.istatistik() : []) || []; }catch(e){ kart = []; }
    kart = kart.filter(x => x && x.ad).map(kartTemiz).filter(x => x.deger != null).slice(0, 4);
    const satirlar = ozetSatirlari().concat(kart.map(x => x.ad + ': ' + x.deger + (x.birim ? ' ' + x.birim : '') + ' (' + x.etiket + ')'));
    if(!satirlar.length){ soyle(ad + ' için bugün özetlenecek bir şey yok.'); return { tur:'sesli-ozet', n:0 }; }
    const x = { zaman:ortam.simdi().toISOString(), modul:ayar.modul, satirlar };
    ortam.depo.yaz(SOZET, [x].concat(sozetler()).slice(0, 20));
    cipler = [{ ad:'Yeniden dinle', is:'sozet-dinle:0' }];
    const okunacak = !sesleMi();
    soyle(ad + '’de bugün:', satirlar);
    if(okunacak) seslendir(sozetMetni(x));                 // yazı kipinde de: istenen şey sesli özet
    return { tur:'sesli-ozet', n:satirlar.length };
  }
  /* ---------- ÖĞRETMEN (kullanıcı, 2026-10-22: «King'i öğretmen yap») ----------
     «türevi anlat», «bana olasılığı öğret», «ders: paragraf» → modülün KENDİ
     anlatımı (kartlar.ders; AYS konu anlatımı, ESP öğrenme kartları) bölüm
     bölüm bir ders kartında. Metni King yazmaz, model çağrılmaz; modülün
     etiketi («elle yazıldı · doğrulanmadı») kartta durur. Sonunda «Anladım,
     soru sor» modülün bankasından o konunun sorusunu getirir (söz 32 yolu);
     yanlış cevapta «Konuyu yeniden anlat» önerilir, cevabı yine modül yazar
     (AYS'de yanlış soru 1, 3, 7 gün sonra tekrar gelir). Modülde konu yoksa
     ders kurulmaz ve mesaj olağan yoluna (Merkez) devam eder. */
  const DERS_RE = /(?:^|\s)(?:anlat(?:ır m[ıi]s[ıi]n|abilir misin|sana)?|öğret(?:ir misin|sene)?|ders(?:i)? (?:ver|yap|anlat)|konu anlatımı)\s*[?.!]*\s*$|^(?:ders|konu anlatımı)\s*:/;
  const DERS_DOLGU = /(^|\s)(bana|bir|biraz|kısaca|lütfen|king|konusunu|konusu|konu|ders|dersi|anlatımı|anlat\S*|öğret\S*|ver|yap|mısın|misin|musun|hakkında|bu|şu)(?=\s|$)/g;
  function dersNiyeti(t){
    if(!DERS_RE.test(t)) return null;
    const konu = t.replace(/[.,!?;:]/g, ' ').replace(DERS_DOLGU, ' ').replace(DERS_DOLGU, ' ').replace(/\s+/g, ' ').trim();
    if(konu.length < 3 || /^(bunu|şunu|onu|daha|bunları|onları|neden|niye)(\s|$)/.test(konu)) return null;
    return { konu };
  }
  async function dersIsle(n, metin){
    const K = ayar && ayar.kartlar;
    if(!K || typeof K.ders !== 'function') return null;
    let d = null;
    try{ d = await K.ders(n.konu); }catch(e){ d = null; }
    const yazi = (v, k) => String(v == null ? '' : v).trim().slice(0, k);
    const bolumler = d && Array.isArray(d.bolumler) ? d.bolumler.filter(b => b && (b.metin || (b.liste && b.liste.length))).slice(0, 10)
      .map(b => ({ baslik:yazi(b.baslik, 120), metin:yazi(b.metin, 1600), liste:(b.liste || []).slice(0, 10).map(x => yazi(x, 400)), dikkat:yazi(b.dikkat, 500) })) : [];
    if(!d || !d.baslik || !bolumler.length) return null;
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
    const ders = { id:String(d.id || ''), baslik:yazi(d.baslik, 120), alt:yazi(d.alt, 120), giris:yazi(d.giris, 900),
      etiket:yazi(d.etiket, 80), sorgu:yazi(d.sorgu || d.baslik, 120), soruVar:!!d.soruVar && typeof K.soru === 'function',
      acilir:typeof K.dersAc === 'function', bolumler, adim:0 };
    soyle(ders.baslik + ' · ders', null, null, null, { ders });
    return { tur:'ders', bolum:bolumler.length };
  }
  function dersHtml(m, n){
    const d = m.ders;
    if(!d) return '';
    const b = d.bolumler[d.adim] || d.bolumler[0], son = d.adim >= d.bolumler.length - 1;
    return '<div class="king__ders" role="group" aria-label="Ders: ' + kac(d.baslik) + '">'
      + '<div class="king__ders-bas"><span>' + kac(d.alt) + '</span>' + (d.etiket ? '<small>' + kac(d.etiket) + '</small>' : '') + '</div>'
      + (d.adim === 0 && d.giris ? '<p class="king__ders-giris">' + bicimli(d.giris) + '</p>' : '')
      + '<div class="king__ders-ilerleme">' + cubukHtml(Math.round((d.adim + 1) * 100 / d.bolumler.length), 'Bölüm ' + (d.adim + 1) + ' / ' + d.bolumler.length)
      + '<small>' + (d.adim + 1) + ' / ' + d.bolumler.length + '</small></div>'
      + '<h4 class="king__ders-baslik">' + kac(b.baslik) + '</h4>'
      + (b.metin ? '<p>' + bicimli(b.metin) + '</p>' : '')
      + (b.liste.length ? '<ul class="king__ders-liste">' + b.liste.map(x => '<li>' + bicimli(x) + '</li>').join('') + '</ul>' : '')
      + (b.dikkat ? '<p class="king__ders-dikkat"><b>Dikkat</b> ' + bicimli(b.dikkat) + '</p>' : '')
      + (b.alinti ? '<p class="king__ders-alinti"><b>Kaynakta</b> «' + kac(b.alinti) + '»</p>' : '')
      + '<div class="king__ders-eylem">'
      + (d.adim > 0 ? '<button type="button" class="king__cip" data-king="ders-geri:' + n + '">Önceki</button>' : '')
      + (!son ? '<button type="button" class="king__cip' + (son ? '' : ' king__cip--ana') + '" data-king="ders-ileri:' + n + '">Devam</button>' : '')
      + (d.soruVar ? '<button type="button" class="king__cip' + (son ? ' king__cip--ana' : '') + '" data-king="ders-soru:' + n + '">Anladım, soru sor</button>' : '')
      + (ortam.sentez() ? '<button type="button" class="king__cip" data-king="ders-dinle:' + n + '">Dinle</button>' : '')
      + (d.acilir ? '<button type="button" class="king__cip" data-king="ders-ac:' + n + '">Modülde aç</button>' : '')
      + '</div></div>';
  }
  function dersAdim(n, fark){
    const m = akis[n];
    if(!m || !m.ders) return false;
    m.ders.adim = Math.max(0, Math.min(m.ders.bolumler.length - 1, m.ders.adim + fark));
    sakla();
    ciz(false);
    return true;
  }
  /* Yanlış cevaptan sonra: aynı konunun en son dersi yeniden, ilk bölümden. */
  function dersBul(sorgu){
    const s = kucuk(sorgu || '');
    for(let i = akis.length - 1; i >= 0; i--) if(akis[i].ders && s && kucuk(akis[i].ders.sorgu) === s) return i;
    return -1;
  }
  function dersTekrar(n){
    const m = akis[n];
    if(!m || !m.ders) return false;
    cipler = null;
    soyle('Bir daha bakalım: ' + m.ders.baslik, null, null, null, { ders:Object.assign({}, m.ders, { adim:0 }) });
    return true;
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
    const bag = (x, alt) => '<li class="king__ars-oge"><a class="king__ars-link" href="' + kac(x.link) + '" target="_blank" rel="noopener noreferrer">'
      + (x.no ? '<span class="king__ars-no">' + x.no + '</span>' : '') + kac(x.baslik) + '</a>'
      + (alt ? '<small>' + kac(alt) + '</small>' : '') + (x.neden ? '<span>' + kac(x.neden) + '</span>' : '') + '</li>';
    return '<div class="king__ars" role="group" aria-label="Araştırma: ' + kac(a.konu) + '">'
      + '<div class="king__ars-bolum"><div class="king__ars-bas"><span class="king__ars-ad">Özet</span>'
      + (a.ozet ? '<button type="button" class="king__cip" data-king="ars-dinle:' + n + '">Dinle</button>' : '') + '</div>'
      + '<p>' + kac(a.ozet || 'Kaynaklardan doğrulanmış kısa bir özet çıkaramadım; aşağıdaki kaynaklara bakabilirsin.') + '</p></div>'
      + (a.izle.length ? '<div class="king__ars-bolum"><span class="king__ars-ad">İzle</span><ul class="king__ars-liste">'
        + a.izle.map(v => bag(v, v.bilgi)).join('') + '</ul></div>' : '')
      + (a.oku.length ? '<div class="king__ars-bolum"><span class="king__ars-ad">Oku</span><ul class="king__ars-liste">'
        + a.oku.map(k => bag(k, k.site)).join('') + '</ul></div>' : '')
      + (a.hedef && D() ? '<div class="king__ars-bolum king__ars-sonraki"><span class="king__ars-ad">Sıradaki adım</span>'
        + '<p>«' + kac(a.hedef.baslik) + '» Defter’e kaynak olarak eklenebilir; onaylamadan eklenmez.</p>'
        + '<button type="button" class="king__cip" data-king="ars-ekle:' + n + '">Defter’e ekle</button></div>' : '')
      + '</div>';
  }
  /* «Defter’e ekle»: King'in not aracı, onay kartıyla (söz 36). */
  async function arastirmaEkle(n){
    const a = akis[n] && akis[n].arastirma, A = ARAC();
    if(!a || !a.hedef || !A) return null;
    const h = a.hedef;
    const o = await A.onizle('not_ekle', { baslik:('Kaynak: ' + h.baslik).slice(0, 120),
      metin:(a.konu + ' için' + (h.kanal ? ' · ' + h.kanal : '') + '\n' + h.link).slice(0, 2000) }, { metin:'' });
    if(!o.ok){ soyle('Defter’e ekleyemedim: ' + o.hata + '.'); return null; }
    return aracKart(o);
  }
  function kartlarHtml(m){
    if(!m.kartlar || !m.kartlar.length) return '';
    return '<div class="king__kartlar" role="list">' + m.kartlar.map(x => '<div class="king__kart" role="listitem">'
      + '<span class="king__kart-ad">' + kac(x.ad) + '</span>'
      + '<b class="king__kart-deger">' + (x.deger == null ? '—' : kac(x.deger) + (x.birim ? '<small> ' + kac(x.birim) + '</small>' : '')) + '</b>'
      + '<span class="king__kart-etiket' + (x.etiket === 'veri yok' ? ' is-yok' : x.etiket === 'tahmin' ? ' is-tahmin' : '') + '">' + kac(x.etiket) + '</span>'
      + (x.alt ? '<small class="king__kart-alt">' + kac(x.alt) + '</small>' : '') + cizgi(x.seri) + '</div>').join('') + '</div>';
  }
  function soruHtml(m, n){
    if(!m.soru) return '';
    const q = m.soru, c = q.cevap;
    return '<div class="king__soru">'
      + '<p class="king__soru-metin">' + kac(q.soru) + '</p>'
      + '<div class="king__soru-sec" role="group" aria-label="Şıklar">' + q.sec.map((s, k) => {
        const h = 'ABCDE'[k];
        const cls = c ? (h === c.dogru ? ' is-dogru' : h === c.harf ? ' is-yanlis' : '') : '';
        return '<button type="button" class="king__soru-sik' + cls + '"' + (c ? ' disabled' : '') + ' data-king="soru-cevap:' + n + ':' + h + '">'
          + '<b>' + h + '</b><span>' + kac(s) + '</span></button>';
      }).join('') + '</div>'
      + (c ? '<p class="king__soru-sonuc' + (c.isabet ? ' is-dogru' : '') + '">' + (c.isabet ? 'Doğru.' : 'Doğru cevap ' + kac(c.dogru) + '.')
        + (c.not ? ' ' + kac(c.not) : '') + '</p>'
        + (c.cozum.length ? '<ul class="king__soru-cozum">' + c.cozum.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : '') : '')
      + (q.not && !c ? '<small class="king__soru-kaynak">' + kac(q.not) + '</small>' : '')
      + (q.kaynak ? '<small class="king__soru-kaynak">' + kac(q.kaynak) + '</small>' : '') + '</div>';
  }
  /* Uzun cevapta hafif biçim: **kalın**, madde ve başlık işaretleri (metin önce kaçırılır). */
  function bicimli(s){
    return kac(s).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/^[ \t]*[*-][ \t]+/gm, '• ').replace(/^#{1,4}[ \t]+/gm, '')
      .replace(/https?:\/\/(?:[^\s<>"'&]|&amp;)+/g, u => {
        /* Sondaki noktalama linkin parçası değil. */
        const son = u.match(/[.,;:!?)\]]+$/);
        const ad = son ? u.slice(0, -son[0].length) : u;
        return '<a href="' + ad + '" target="_blank" rel="noopener noreferrer">' + ad + '</a>' + (son ? son[0] : '');
      });
  }

  async function isle(metin){
    gozSonEtkilesim = ortam.simdi().getTime();
    if((bolum === 'araclar' || bolum === 'kutuphane')){ bolum = 'sohbet'; kvGiris = true; }     // sayfadayken sorulan sohbette görünür
    /* Söz 8: bekleyen soruya yazıyla cevap («evet», «hayır»). */
    const t0 = kucuk(metin);
    if(!akis.some(m => m.kim === 'sen')) sohbetBasYaz();     // söz 33: yeni sohbet ya da yeni gün
    if(ritim) return ritimIsle(metin);                        // söz 34: haftalık gözden geçirme sürüyor
    if(gunlukBekle) return gunlukIsle(metin);                 // söz 34: günlük metni bekleniyor
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
    /* K2: King'in sorduğu soruya (söz, beceri) ilk cevap yerel kurallara takılmadan
       Merkez'e gider; cevabı HKM yakalar, sayı varsa modüle onaylı öneri olur. */
    if(k2Soru && t0 && baglanti() && ortam.simdi().getTime() - k2Soru < 12 * 3600 * 1000){
      k2Soru = 0;
      return merkezYolu(metin, { tur:'bilinmiyor', metin });
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
    /* Öğretmen (2026-10-22): «türevi anlat» → modülün kendi anlatımından ders
       kartı. Modülde o konu yoksa yol açık kalır (Merkez cevaplar). */
    const DN = dersNiyeti(t0);
    if(DN){ const r = await dersIsle(DN, metin); if(r) return r; }
    if(SOZET_RE.test(t0)) return sesliOzet(metin);
    /* DEVRİM: derse çevir, derslerden soru, kişisel yasalar, günüm. */
    const DC = String(metin || '').trim().match(DERSE_RE);
    if(DC){ akis.push({ kim:'sen', metin:String(metin).trim().slice(0, 160) + (String(metin).length > 160 ? '…' : '') }); cipler = null;
      return derseCevir(DC[1] && DC[1].length >= 400 ? DC[1] : (kaynakMetin && kaynakMetin.metin) || DC[1], DC[1] && DC[1].length >= 400 ? 'yapıştırılan metin' : kaynakMetin && kaynakMetin.ad); }
    if(KD_SORU_RE.test(t0)){ akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null; return kdSoru(null); }
    if(YASA_RE.test(t0)) return yasaIsle(metin);
    if(GUN_KAPAT_RE.test(t0)) return gunIsle(metin, true);
    if(GUN_RE.test(t0)) return gunIsle(metin, false);
    { const AK = aracKutusu(metin, t0); if(AK) return AK; }
    /* Söz 32: kartlar (istatistik, soru); «sorma» komutundan önce. */
    const KN = kartNiyeti(t0);
    if(KN) return kartIsle(KN, metin);
    /* Söz 33: King'in kendi ayarları, odak sayacı, Merkez komutları. */
    const AK = ayarKomutu(t0);
    if(AK){ akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null; soyle(AK); return { tur:'ayar' }; }
    if(/(odağı bitir|odak sayacını durdur|sayacı durdur)/.test(t0)){ akis.push({ kim:'sen', metin:String(metin).trim() }); odakDur(); return { tur:'odak-dur' }; }
    const OD = t0.match(ODAK_RE);
    if(OD){
      akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null;
      const dk = Math.max(1, Math.min(180, Number(OD[1]) || 25)), konu = String(OD[2] || '').trim();
      odakBaslat(dk, konu);
      soyle(dk + ' dakikalık odak başladı' + (konu ? ' (' + konu + ')' : '') + '. Süre dolunca haber vereceğim; «sayacı durdur» dersen dururum.');
      return { tur:'odak', dk };
    }
    if(HAFTA_RE.test(t0)) return merkezKomut(metin, 'hafta', 'Haftalık değerlendirme');
    if(CAPRAZ_RE.test(t0)) return merkezKomut(metin, 'capraz', 'Modüller arası bulgular');
    /* Söz 34 */
    if(ONCELIK_RE.test(t0)) return oncelikIsle(metin);
    if(RITIM_RE.test(t0)) return ritimBaslat(metin);
    if(YUK_RE.test(t0)) return yukIsle(metin);
    if(GUNLUK_RE.test(t0)){ akis.push({ kim:'sen', metin:String(metin).trim() }); cipler = null; gunlukBekle = true;
      soyle(D() ? 'Anlat, dinliyorum. Bitince gönder; Defter’e günlük olarak yazacağım. Vazgeçersen «vazgeç» de.' : 'Defter bu modülde kurulu değil; günlüğü buraya yazamam.');
      if(!D()) gunlukBekle = false;
      return { tur:'gunluk' }; }
    if(DENEY_DURUM_RE.test(t0)) return deneyDurum(metin);
    const DB = t0.match(DENEY_RE);
    if(DB) return deneyBaslat(metin, DB[1]);
    if(NOT_RE.test(t0)) return notAra(metin, t0);
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
    /* Söz 36: «bu sistemde ne var, nerede, nasıl yapılır» — kodun haritası. */
    if(HARITA_RE.test(t0) && !veriGibi(metin)) return haritaIsle(metin);
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
      const tur = kameraMi() ? 'kamera' : 'ekran';
      try{ kare = paylasim.kare(); }catch(e){ soyle((tur === 'kamera' ? 'Kameranın' : 'Ekranın') + ' karesi alınamadı: ' + ((e && e.message) || 'bilinmeyen hata')); return { tur }; }
      await gorselCevap(String(metin).trim(), kare, tur === 'kamera' && INCE_OKU.test(kucuk(metin)) ? 'gorsel' : 'ekran');
      return { tur };
    }
    return merkezYolu(metin, y);
  }
  /* Sohbet: anlatımdaki kayıtlar, modelsiz okuma, sonra HKM'deki King; olmazsa yerel. */
  async function merkezYolu(metin, y){
    const senMesaj = Object.assign({ kim:'sen', metin:String(metin).trim() }, siradanSoru ? { sira:siradanSoru.zaman } : {});
    akis.push(senMesaj);
    bekleyen = null;
    bekleyenGit = null;
    bekleyenIlet = null;
    cipler = null;
    /* Söz 35: anlatımın içindeki kayıtlar tek kartta; sohbet sürer. */
    let bulunan = (y.tur === 'bilinmiyor' || y.tur === 'ozet' || y.tur === 'veri' || (y.tur === 'git' && y.kaynak !== 'komut')) ? sohbettenBul(metin) : null;
    /* Tek kayıtlık cümleyi tek satır kapısı zaten önizler (söz 10); kart yalnız birden çok kayıtta. */
    if(bulunan && y.tur === 'veri' && bulunan.filter(o => o.modul !== 'defter').length < 2) bulunan = null;
    if(bulunan){
      bulunanGoster(bulunan, 'Anlattıklarında şunları buldum; seçtiklerini kaydedeyim:');
      if(!baglanti()) return { tur:'bulunan', n:bulunan.length };
    }
    /* Söz 36: modelsiz okuma — `es` taşıyan okuma aracı kuralla (arac.js söz 4). */
    const KA = !bulunan && y.tur === 'bilinmiyor' && ARAC() ? ARAC().kuralla(metin) : null;
    if(KA){
      const rk = await aracIsle({ arac:[KA] }, metin);
      if(rk) return rk;
    }
    /* Söz 6: soru, özet ve anlaşılmayan istek HKM'deki King'e. */
    const merkeze = !!baglanti() && (!!bulunan || y.tur === 'bilinmiyor' || y.tur === 'ozet'
      || (y.tur === 'git' && y.kaynak !== 'komut' && soruMu(metin)));
    let neden = null;
    if(merkeze){
      const bek = { kim:'king', bekliyor:true, metin:'' };
      akis.push(bek);
      ciz(false);
      const r = await merkezeSor(metin, bek, { araclar:!bulunan });
      akis = akis.filter(m => m !== bek);
      /* Söz 36: model bir araç seçti; kod doğrular, okuma çalışır, yazma onay ister. */
      if(r.ok && r.arac){
        const ra = await aracIsle(r, metin);
        if(ra) return ra;
        if(r.text){ soyle(r.text); return { tur:'merkez', mode:'arac' }; }
        return yerel(y, null, metin);
      }
      if(r.ok && r.arastirma){
        /* Söz 38: araştırma kartı; düz metin yalnız kart çizilemezse. */
        soyle('«' + r.arastirma.konu + '» için internette ve YouTube’da baktım.', null, null, null, { arastirma:r.arastirma });
        return { tur:'merkez', mode:r.mode };
      }
      if(r.ok){
        const ek = Object.assign(r.akti ? { yeni:false, okunan:r.okunan } : {}, r.k2 ? { k2:r.k2 } : {});
        soyle(r.text, null, null, null, Object.keys(ek).length ? ek : null);
        /* K1: görev ya da iş kurulduysa rozet hemen tazelenir; pano bir dokunuşta. */
        if(r.mode === 'ekip'){ cipler = [{ ad:'Ekip ve görevler', is:'ekip-ac' }]; isYokla(); }
        else if(r.mode === 'beceri') cipler = [{ ad:'Beceriler ve sözler', is:'beceri-ac' }];
        else cipler = oneriListesi(true);                   // söz 33
        ciz(false);
        /* K2: sözün cevabındaki kayıt bu modülün kutusundaysa hemen onaya sunulur. */
        if(r.k2 && r.k2.kutuya === ayar.modul) kutuyuSun();
        if(r.eylemler) await eylemleriCalistir(r.eylemler.filter(e => e && e.tur !== 'mesaj' && e.tur !== 'soru'));
        return { tur:'merkez', mode:r.mode };
      }
      neden = r.neden;
    }
    /* K4: Merkez kurulu ama ulaşılamıyor; Merkez'e giden soru sıraya girer. */
    if(neden === 'baglanti' && !bulunan && y.tur === 'bilinmiyor'){
      const n = siraEkle(metin);
      /* Sıradan yeniden deneme başarısızsa sohbete hiçbir şey yazılmaz (dakikada bir gürültü olurdu). */
      if(siradanSoru){ akis = akis.filter(m => m !== senMesaj); ciz(false); return { tur:'sira', n, sessiz:true }; }
      cipler = [{ ad:'Sırayı gör', is:'bolum:kutuphane' }];
      soyle('Merkeze (HKM) şu an ulaşılamadı. Sorunu sıraya aldım; bağlantı gelince kendim soracağım. Sırada ' + n + ' soru var.');
      siraPlanla();
      return { tur:'sira', n };
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
    const foto0 = !!bekleyenFoto || fotoHedef != null;
    const yetki0 = !!bekleyenYetki;
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; bekleyenFoto = null; bekleyenYetki = null; cipler = null; fotoHedef = null;
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
    /* Söz 36: modelin seçtiği yazan araç da bu kapıdan uygulanır (arac.js). */
    if(!n || (!n.arac && !Y) || (n.arac && !ARAC())) return null;
    const bek = { kim:'king', bekliyor:true, metin:'' };
    akis.push(bek);
    ciz(false);
    const r = n.arac ? await ARAC().uygula(n) : await Y.uygula(n);
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
  /* ---------- söz 36: araç kataloğu (arac.js) ---------- */
  const ARAC = () => (L.ARAC && typeof L.ARAC.liste === 'function') ? L.ARAC : null;
  const HARITA_RE = /(bu sistemde (?:ne|neler) var|sistemde (?:ne|neler) var|lifeos'?ta (?:ne|neler) var|neler yapabilirsin|ne(?:ler)?i? yapabiliyorsun|neleri yapabilirsin|sistem haritası|(?:^|\s)nasıl yapılır|(?:^|\s)nerede(?:dir)?\s*\??$|nereden (?:girerim|eklerim|yaparım|bakarım|açarım)|nasıl (?:girerim|eklerim|kaydederim|açarım|değiştiririm))/;
  const HARITA_DOLGU = /(bu sistemde|sistemde|lifeos'?ta|ne var|neler var|neler yapabilirsin|nasıl yapılır|nerede(?:dir)?|nereden|nasıl|girerim|eklerim|yaparım|bakarım|açarım|kaydederim|değiştiririm|king|\?)/g;
  const YETKI_AYAR = {
    tema:{ id:'tema', degerler:{ koyu:'dark', acik:'light', sistem:'system' } },
    animasyon:{ id:'animasyon', degerler:{ tam:'tam', az:'az', sistem:'sistem' } },
    zemin:{ id:'zemin', degerler:{ sade:'sade', canli:'yumusak' } },
    muzik:{ id:'muzik', degerler:{ cal:'cal', dur:'dur' } },
  };
  const KING_AYAR = {
    cevap:{ ad:'Cevap biçimi', degerler:['oto', 'ses', 'yazi'], oku:() => cevapBicimi(), yaz:v => cevapSec(v), adlar:{ oto:'Otomatik', ses:'Sesli', yazi:'Yazılı' } },
    derinlik:{ ad:'Düşünme', degerler:DERIN_TERCIH, oku:() => derinlik(), yaz:v => derinlikSec(v), adlar:DERIN_AD },
    tarz:{ ad:'Tarz', degerler:TARZLAR, oku:() => tarz(), yaz:v => tarzSec(v), adlar:TARZ_AD },
    ses:{ ad:'Ses', degerler:SES_TERCIH, oku:() => sesTercihi(), yaz:v => sesTercihSec(v), adlar:SES_AD },
  };
  /* Kendi akışını çizen araç (kart, öncelik, not arama…): kullanıcının mesajı
     zaten sohbette; akış onu yeniden ekler, iki kez görünmesin. */
  async function akisla(fn){
    const i = akis.map(m => m.kim).lastIndexOf('sen');
    const m = i >= 0 ? akis.splice(i, 1)[0] : null;
    await fn(m ? m.metin : '');
    return { yerine:true };
  }
  function haritaVeri(konu){
    const A = ARAC();
    const h = A ? A.harita(SAYFALAR) : { moduller:[], okuma:[], yazma:[] };
    const k = kucuk(konu || '');
    if(!k) return h;
    const s = sayfaBul(k);
    return Object.assign({}, h, { konu:k, araclar:A ? A.ara(k).map(a => ({ ne:String(a.aciklama).split(/(?<=\.)\s/)[0], ornek:a.ornek || '', tur:a.tur })) : [],
      isler:A && A.isAra ? A.isAra(k) : [], sayfa:s ? { ad:s.ad, modul:MODUL_AD[s.modul] } : null });
  }
  /* Söz 37: işin nasıl yapıldığı tek satırda. */
  const isSatiri = x => x.ad + (x.modul !== 'king' && x.modul !== (ayar && ayar.modul) ? ' (' + MODUL_AD[x.modul] + ')' : '')
    + (x.tur === 'foto' ? ' — kamera ya da fotoğraf: + › Tüm işler' : ' — King’e «' + String(x.ornek || '').trim() + '» yaz');
  function haritaCevap(konu){
    const v = haritaVeri(konu);
    const ad = MODUL_AD[ayar && ayar.modul] || 'Bu modül';
    if(v.konu){
      const l = (v.isler || []).slice(0, 3).map(isSatiri)
        .concat((v.araclar || []).map(a => a.ne.replace(/[.]$/, '') + (a.ornek ? ' — King’e «' + a.ornek + '» yaz' : '')));
      if(v.sayfa) l.push('Sayfası: ' + v.sayfa.ad + ' (' + v.sayfa.modul + ')');
      if(!l.length){
        const m = v.moduller.find(x => x.alanlar.some(a => kucuk(a).indexOf(v.konu.split(' ')[0].slice(0, 5)) >= 0));
        return { sonuc:v, cevap:m ? '«' + konu + '» ' + m.ad + '’nin işi; orada King’e sorabilir ya da sayfasından yapabilirsin.'
          : '«' + konu + '» için bu modülde bir araç ya da sayfa bulamadım.', satirlar:v.moduller.map(x => x.ad + ' — ' + x.is) };
      }
      return { sonuc:v, cevap:'«' + konu + '» için:', satirlar:l.slice(0, 6) };
    }
    /* Söz 37: her modülün King'le yapılan işleri, modüle göre (bulunulan önce). */
    const isler = v.isler || [];
    const grup = m => (isler.find(g => g.modul === m) || { isler:[] }).isler.map(x => x.ad + (x.tur === 'foto' ? ' (kamera)' : '')).join(', ');
    const ortak = grup('king');
    return { sonuc:v, cevap:'LifeOS’ta dört bölüm var; ' + ad + ' içinde King’le ' + v.okuma.length + ' okuma ve ' + v.yazma.length
      + ' değişiklik işi yapabilirsin. Hepsi + › Tüm işler’de, modüle göre:',
      satirlar:v.moduller.map(x => { const m = Object.keys(MODUL_AD).find(k => MODUL_AD[k] === x.ad), g = m ? grup(m) : '';
        return x.ad + ' — ' + x.is + ': ' + (g ? 'King’le ' + g : x.alanlar.slice(0, 4).join(', ')) + (x.sayfalar.length ? ' · sayfalar: ' + x.sayfalar.join(', ') : ''); })
        .concat(ortak ? ['King — her modülde: ' + ortak] : []) };
  }
  function haritaIsle(metin){
    akis.push({ kim:'sen', metin:String(metin).trim() });
    bekleyen = null; bekleyenGit = null; bekleyenIlet = null; cipler = null;
    const konu = kucuk(metin).replace(HARITA_DOLGU, ' ').replace(/\s+/g, ' ').trim();
    const r = haritaCevap(konu.length >= 3 ? konu : '');
    soyle(r.cevap, r.satirlar);
    return { tur:'harita', konu:r.sonuc.konu || '' };
  }
  function ortakAraclar(){
    const rotalar = SAYFALAR.map(s => s.route).filter((v, i, a) => a.indexOf(v) === i);
    const Y = () => yetkiKatalog();
    const K = () => (ayar && ayar.kartlar) || {};
    const sira = { type:'object', properties:{ sira:{ type:'integer', minimum:1, maximum:30, description:'bekleyen listesindeki sıra (1 = ilk)' } }, required:['sira'] };
    const yetkiNiyet = (id, p) => { const y = Y(); const n = y && y.niyet ? y.niyet(id, p) : null; return n ? { yetki:n } : { hata:'bu değişiklik şu an yapılamıyor' }; };
    const oneri = p => { const y = Y(); const l = y && y.bekleyenler ? y.bekleyenler() : []; return l[p.sira - 1] || null; };
    const l = [
      { ad:'sistem_haritasi', tur:'oku', ornek:'bu sistemde neler var?',
        aciklama:'LifeOS’ta ne var: hangi iş hangi modülde, hangi sayfada ve King’den nasıl yapılır. «Ne var», «nerede», «nasıl yapılır» sorularında çağır.',
        parametreler:{ type:'object', properties:{ konu:{ type:'string', maxLength:80, description:'aranan iş (ör. «uyku girmek»); boşsa genel harita' } } },
        calistir:p => haritaCevap(p.konu || '') },
      { ad:'sayfa_ac', tur:'oku', ornek:'deneme sayfasını aç',
        aciklama:'Bir modülün sayfasını açar; veri değiştirmez. Sayfalar: ' + SAYFALAR.map(s => s.modul + '/' + s.route + ' ' + s.ad).join(', ') + '.',
        parametreler:{ type:'object', properties:{ modul:{ type:'string', enum:['ays', 'spi', 'esp'] }, sayfa:{ type:'string', enum:rotalar } }, required:['modul', 'sayfa'] },
        calistir:p => {
          if(!SAYFALAR.some(s => s.modul === p.modul && s.route === p.sayfa)) return { hata:'bu modülde böyle bir sayfa yok' };
          const h = { modul:p.modul, route:p.sayfa };
          ortam.zamanla(() => git(h), sesli ? 1100 : 650);
          return { cevap:eylemCumlesi(h, 'Tamam.') };
        } },
      { ad:'kayit_gir', tur:'yaz', ornek:({ ays:'matematikten 40 soru çözdüm', spi:'7 saat uyudum', esp:'45 dk gitar' })[ayar && ayar.modul] || '7 saat uyudum',
        aciklama:'Kullanıcının YAPTIĞI bir işi (soru, süre, uyku, su, öğün, antrenman, çalışma oturumu, not) bu modülün kendi ayrıştırıcısıyla kayda çevirir; önizleme gösterilir, onayla yazılır. metin: kullanıcının cümlesi, sayıları aynen.',
        parametreler:{ type:'object', properties:{ metin:{ type:'string', maxLength:300 } }, required:['metin'] },
        kullanilir:() => !!veriKapisi(),
        onizle:(p, b) => {
          const v = veriKapisi();
          if(!v) return { hata:'bu modülde kayıt kapısı yok' };
          const asil = String((b && b.metin) || '');
          /* Gelecek, olumsuz ya da soru cümlesi kayıt değildir; modelin yeniden
             yazması bunu aşamaz (olumsuz.js, KR-1). */
          if(asil && kayitDegil(asil)) return { hata:'bu cümle yapılmış bir işi anlatmıyor (gelecek, olumsuz ya da soru)' };
          /* Önce kullanıcının KENDİ cümlesi; olmazsa modelinki, sayısı korunmuşsa. */
          for(const m of [asil, p.metin]){
            if(!m || kayitDegil(m)) continue;
            if(m !== asil && asil && !ARAC().sayiKorunur(asil, m)) return { hata:'senin cümlende geçmeyen bir sayı çıktı' };
            let o = null;
            try{ o = v.onizle(String(m).trim()); }catch(e){ o = null; }
            if(o && typeof o.kaydet === 'function') return { veri:o };
          }
          return { hata:'modül bu cümleyi kayıt olarak anlamadı' };
        },
        uygula:() => ({ ok:false, metin:'Kayıt önizlemeden yazılır.' }) },
      { ad:'bugun_ozeti', tur:'oku', ornek:'bugünün özeti', aciklama:'Bu modülde bugünün özeti (modülün kendi cümleleri).',
        kullanilir:() => !!(ayar && typeof ayar.ozet === 'function'),
        calistir:() => { const s = ozetSatirlari(); return { sonuc:{ satirlar:s }, cevap:s.length ? (MODUL_AD[ayar.modul] || '') + '’de bugün:' : 'Bugün için henüz bir şey yok.', satirlar:s }; } },
      { ad:'istatistikler', tur:'oku', ornek:'istatistiklerim', aciklama:'Bu modülün istatistik kartları (sayıları modül hesaplar).',
        kullanilir:() => typeof K().istatistik === 'function', calistir:() => akisla(m => kartIsle({ tur:'istatistik' }, m)) },
      { ad:'soru_sor', tur:'oku', ornek:'türev hakkında soru sor', aciklama:'Modülün bankasından bir soru kartı getirir.',
        parametreler:{ type:'object', properties:{ konu:{ type:'string', maxLength:60 } } },
        kullanilir:() => typeof K().soru === 'function', calistir:p => akisla(m => kartIsle({ tur:'soru', konu:p.konu || '' }, m)) },
      { ad:'oncelik_listesi', tur:'oku', ornek:'neye çalışayım', aciklama:'Puan getirecek öncelikli konular (modülün hesabı: çıkma sıklığı × hata).',
        kullanilir:() => typeof K().oncelik === 'function', calistir:() => akisla(m => oncelikIsle(m)) },
      { ad:'yuk_durumu', tur:'oku', ornek:'yük durumum', aciklama:'Son 7 gün ile önceki 7 günün karşılaştırması ve yük sinyali.',
        kullanilir:() => typeof K().yuk === 'function', calistir:() => akisla(m => yukIsle(m)) },
      { ad:'not_ara', tur:'oku', ornek:'notlarımda türev', aciklama:'Defter notlarında arar; bulunan notlara dayanarak cevaplar.',
        parametreler:{ type:'object', properties:{ sorgu:{ type:'string', maxLength:80 } }, required:['sorgu'] },
        kullanilir:() => !!D(), calistir:p => akisla(m => notAra(m || p.sorgu, kucuk(p.sorgu))) },
      { ad:'not_ekle', tur:'yaz', ornek:'deftere not: üslülerde tabanlar aynıysa üsler toplanır', aciklama:'Defter’e yeni bir not yazar.',
        parametreler:{ type:'object', properties:{ baslik:{ type:'string', maxLength:120 }, metin:{ type:'string', maxLength:2000 } }, required:['metin'] },
        kullanilir:() => !!D(),
        onizle:p => ({ metin:'Defter’e not eklenecek' + (p.baslik ? ': «' + p.baslik + '»' : '') + '.', satirlar:[String(p.metin).slice(0, 160)] }),
        uygula:async p => {
          const n = await D().yeni(p.baslik || String(p.metin).split(/[.\n]/)[0].slice(0, 60), p.metin, 'not');
          return { metin:'Defter’e yazdım.', geriAl:n && n.id && D().sil ? async () => { await D().sil(n.id); } : null };
        } },
      { ad:'onaylari_listele', tur:'oku', ornek:'bekleyen öneriler', aciklama:'Onaylar’da bekleyen öneriler (sıra numarasıyla).',
        kullanilir:() => !!(Y() && Y().bekleyenler),
        calistir:() => { const b = Y().bekleyenler(); return { sonuc:{ bekleyen:b.map((x, i) => ({ sira:i + 1, metin:x.metin })) },
          cevap:b.length ? b.length + ' öneri onay bekliyor:' : 'Onay bekleyen öneri yok.', satirlar:b.slice(0, 8).map((x, i) => (i + 1) + '. ' + x.metin) }; } },
      { ad:'oneri_onayla', tur:'yaz', ornek:'ikinci öneriyi onayla', aciklama:'Onaylar’daki bir öneriyi onaylar; modülün kendi kodu uygular.', parametreler:sira,
        kullanilir:() => !!(Y() && Y().bekleyenler), onizle:p => { const x = oneri(p); return x ? yetkiNiyet('onay-tek', { id:x.id, metin:x.metin }) : { hata:'o sırada öneri yok' }; }, uygula:() => ({ ok:false }) },
      { ad:'oneri_gec', tur:'yaz', ornek:'ilk öneriyi geç', aciklama:'Onaylar’daki bir öneriyi geçer; uygulanmaz.', parametreler:sira,
        kullanilir:() => !!(Y() && Y().bekleyenler), onizle:p => { const x = oneri(p); return x ? yetkiNiyet('red-tek', { id:x.id, metin:x.metin }) : { hata:'o sırada öneri yok' }; }, uygula:() => ({ ok:false }) },
      { ad:'onerilerin_hepsi', tur:'yaz', ornek:'hepsini onayla', aciklama:'Bekleyen bütün önerileri onaylar ya da geçer.',
        parametreler:{ type:'object', properties:{ karar:{ type:'string', enum:['onayla', 'gec'] } }, required:['karar'] },
        kullanilir:() => !!(Y() && Y().bekleyenler), onizle:p => yetkiNiyet(p.karar === 'onayla' ? 'onay-hepsi' : 'red-hepsi', {}), uygula:() => ({ ok:false }) },
      { ad:'ayar_degistir', tur:'yaz', ornek:'koyu temaya geç',
        aciklama:'LifeOS görünüm ayarı: tema (koyu, acik, sistem), animasyon (tam, az, sistem), zemin (sade, canli), muzik (cal, dur).',
        parametreler:{ type:'object', properties:{ ayar:{ type:'string', enum:Object.keys(YETKI_AYAR) }, deger:{ type:'string', maxLength:12 } }, required:['ayar', 'deger'] },
        kullanilir:() => !!Y(),
        onizle:p => { const a = YETKI_AYAR[p.ayar], v = a && a.degerler[kucuk(p.deger).replace(/ı/g, 'i').replace('açık', 'acik').replace('canlı', 'canli')];
          return v ? yetkiNiyet(a.id, { v }) : { hata:p.ayar + ' için bu değer yok' }; }, uygula:() => ({ ok:false }) },
      { ad:'king_ayari', tur:'yaz', ornek:'cevapları sesli oku',
        aciklama:'King’in kendi tercihi: cevap (oto, ses, yazi), derinlik (oto, hizli, dengeli, derin), tarz (samimi, resmi, kisa), ses (oto, gemini, piper, cihaz).',
        parametreler:{ type:'object', properties:{ ayar:{ type:'string', enum:Object.keys(KING_AYAR) }, deger:{ type:'string', maxLength:12 } }, required:['ayar', 'deger'] },
        onizle:p => { const a = KING_AYAR[p.ayar];
          return a && a.degerler.indexOf(p.deger) >= 0 ? { metin:a.ad + ' «' + (a.adlar[p.deger] || p.deger) + '» olacak (şu an «' + (a.adlar[a.oku()] || a.oku()) + '»).' } : { hata:'bu değer yok' }; },
        uygula:p => { const a = KING_AYAR[p.ayar], eski = a.oku(); a.yaz(p.deger);
          return { metin:a.ad + ' artık «' + (a.adlar[p.deger] || p.deger) + '».', geriAl:async () => { a.yaz(eski); } }; } },
      { ad:'odak_baslat', tur:'oku', ornek:'25 dakika matematik çalışalım', aciklama:'King’in odak sayacını başlatır (kayıt yazmaz; bitince kaydetmeyi sorar).',
        parametreler:{ type:'object', properties:{ dakika:{ type:'integer', minimum:1, maximum:180 }, konu:{ type:'string', maxLength:60 } }, required:['dakika'] },
        calistir:p => { odakBaslat(p.dakika, p.konu || ''); return { cevap:p.dakika + ' dakikalık odak başladı' + (p.konu ? ' (' + p.konu + ')' : '') + '. Süre dolunca haber vereceğim.' }; } },
      { ad:'odak_durdur', tur:'oku', ornek:'sayacı durdur', aciklama:'Çalışan odak sayacını durdurur.',
        calistir:() => { const v = odak(); odakTemizle(); ortam.depo.sil(ODAK); return { cevap:v ? 'Odak sayacını durdurdum.' : 'Çalışan bir odak sayacı yok.' }; } },
      { ad:'merkez_raporu', tur:'oku', ornek:'haftalık değerlendirme', aciklama:'Merkez’in raporu: hafta (haftalık değerlendirme) ya da capraz (modüller arası bulgular); sayıları kural motoru yazar.',
        parametreler:{ type:'object', properties:{ tur:{ type:'string', enum:['hafta', 'capraz'] } }, required:['tur'] },
        calistir:p => akisla(m => merkezKomut(m, p.tur, p.tur === 'hafta' ? 'Haftalık değerlendirme' : 'Modüller arası bulgular')) },
    ];
    /* Modülün yetki eylemleri (toplantı, inceleme, kitap ekle; yetki.js söz 8–9). */
    const y = Y();
    (y && y.ekKatalog ? y.ekKatalog() : []).forEach(e => {
      l.push({ ad:'eylem_' + e.id.replace(/[^a-z0-9]+/g, '_'), tur:'yaz', aciklama:e.aciklama || e.ad + '.', ornek:e.ad.toLocaleLowerCase('tr'),
        parametreler:e.parametreler || undefined, onizle:p => yetkiNiyet(e.id, p), uygula:() => ({ ok:false }) });
    });
    return l;
  }

  /* Yazan aracın önizlemesi onay kartı olur (model seçimi ve söz 37'nin fotoğraf işi aynı kart). */
  function aracKart(o, onMetin, ekSatir){
    if(o.onizle.veri){
      /* Kayıt: yerel veri önizlemesiyle aynı kart (söz 3, 8). */
      const p = o.onizle.veri;
      bekleyen = p;
      cipler = [{ ad:'Evet, ekle', is:'kaydet' }, { ad:'Hayır', is:'vazgec' }];
      const s = sohbet(p, '', false);
      soyle(s.selam, null, { metin:p.metin, liste:(p.parcalar || []).length > 1 ? p.parcalar.map(x => x.metin) : null, ipucu:p.ipucu || '' }, s.soru);
      return { tur:'arac-veri', ad:o.ad };
    }
    const n = o.onizle.yetki ? o.onizle.yetki : { tur:'eylem', arac:true, ad:o.ad, param:o.param, seviye:o.seviye, onizle:o.onizle };
    bekleyenYetki = n;
    cipler = [{ is:'yetki-onay', ad:n.seviye === 'buyuk' ? 'Dönüş noktası al ve uygula' : 'Onayla' }, { is:'vazgec', ad:'Vazgeç' }];
    const satir = (n.onizle.satirlar || []).concat(Array.isArray(ekSatir) ? ekSatir : []);
    soyle((onMetin ? onMetin + ' ' : '') + n.onizle.metin, satir.length ? satir : null, null,
      n.seviye === 'buyuk' ? 'Büyük değişiklik: «Onaylıyorum» yaz ya da düğmeye dokun.' : 'Onaylıyor musun?');
    return { tur:'arac-yaz', ad:o.ad, seviye:n.seviye };
  }

  /* Modelin seçimi (HKM'de doğrulanmış) burada YENİDEN doğrulanır ve çalışır. */
  async function aracIsle(r, metin){
    const A = ARAC();
    if(!A) return null;
    const red = (Array.isArray(r.reddedilen) ? r.reddedilen : []).slice();
    const sonuclar = [], dogrudan = [];
    let yazma = null, yerine = false;
    for(const c of (r.arac || []).slice(0, 3)){
      const d = A.dogrula(c && c.ad, c && c.param);
      if(!d.ok){ red.push({ ad:String(c && c.ad || ''), neden:d.hata }); continue; }
      if(d.arac.tur === 'yaz'){ if(!yazma) yazma = d; continue; }
      const x = await A.calistir(d.arac.ad, d.param, { metin });
      if(!x.ok){ red.push({ ad:d.arac.ad, neden:x.hata }); continue; }
      if(x.yerine) yerine = true;
      else if(x.cevap) dogrudan.push(x);
      else sonuclar.push(x);
    }
    if(yazma){
      const o = await A.onizle(yazma.arac.ad, yazma.param, { metin });
      if(!o.ok){
        soyle('Bunu yapmak istedim ama olmadı: ' + o.hata + '. Kendi cümlenle yazarsan ya da sayfasından yaparsan olur.');
        return { tur:'arac-red' };
      }
      return aracKart(o);
    }
    dogrudan.forEach(x => soyle(x.cevap, x.satirlar));
    if(sonuclar.length){
      /* İkinci tur: sonucu kod üretti; model yalnız cümleye çevirir (HKM sayıyı denetler). */
      const bek = { kim:'king', bekliyor:true, metin:'' };
      akis.push(bek); ciz(false);
      const r2 = await merkezeSor(metin, bek, { arac_sonuclari:sonuclar.map(x => ({ ad:x.ad, param:x.param, sonuc:x.sonuc })) });
      akis = akis.filter(m => m !== bek);
      const satir = [].concat.apply([], sonuclar.map(x => x.satirlar || []));
      if(r2.ok && !r2.arac) soyle(r2.text, satir.length ? satir : null, null, null, r2.akti ? { yeni:false, okunan:r2.okunan } : null);
      else soyle(satir.length ? 'Sistemden okudum:' : 'Sistemden okudum ama Merkez cümleye çeviremedi; ilgili sayfadan bakabilirsin.', satir.length ? satir : null);
      cipler = oneriListesi(true);
      ciz(false);
      return { tur:'arac-oku', n:sonuclar.length };
    }
    if(yerine || dogrudan.length) return { tur:'arac-oku', n:dogrudan.length };
    return null;
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
      + isRozet()
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
    const mik = konusabilir()
      ? '<button type="button" class="king__mik' + (dinleyen ? ' is-acik' : '') + '" data-king="dinle" aria-pressed="' + (dinleyen ? 'true' : 'false')
        + '" aria-label="' + (dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor') + '"><svg viewBox="0 0 24 24" aria-hidden="true">'
        + '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>' : '';
    return bas + (paylasim ? '<div class="king__paylasim" role="status"><i class="king__canli" aria-hidden="true"></i>' + (kameraMi() ? 'Kamera açık' : 'Ekran paylaşılıyor') + ' · sorduğunda görürüm'
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
    /* G: başlıkta yalnız küre, King, modül, canlı iş rozeti (ve odak sayacı),
       kip seçici, küçült, kapat. Bağlantı durumu Ayarlar'da; liste düğmesi
       listenin içinde ve kenardaki çıkıntıda. */
    const bas = '<div class="king__bas">'
      + KURE + '<b>King</b>'
      + '<span class="king__yer">' + NOKTA(ayar && ayar.modul) + kac(MODUL_AD[ayar && ayar.modul] || '') + '</span>'
      + isRozet() + odakHtml() + kipHtml()
      + '<button type="button" class="king__kapat king__kucult" data-king="kucult" aria-label="Küçült" title="Küçült: sayfayı kullanırken açık kalır">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5l-6 6M14 11h-3V8M5 19l6-6M10 13h3v3"/></svg></button>'
      + '<button type="button" class="king__kapat" data-king="kapat" aria-label="Kapat" title="Kapat (Esc)">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>';
    const alan = alanHtml();
    const ilkSira = akis.length - satirlar.length;
    const vitrin = (bolum === 'araclar' || bolum === 'kutuphane');
    const yan = rayHtml() + listeHtml() + yanDugmeHtml('king__cikinti') + '<div class="king__ana' + (vitrin ? ' king__ana--vitrin' : '') + '">';
    /* Boş sohbet = karşılama (söz 27; 2026-10-19 GPT gibi): ortada küre,
       selam, modülün kartları ve özeti, hazır cevaplar. İlk mesajla gider. */
    const kars = akis.length ? { kartlar:[], satirlar:[] } : karsilama();
    const oneriler = (ortam.simdi().getDay() === 0 ? [{ ad:'Haftalık gözden geçirme', is:'oner-metin:haftalık gözden geçirme' }] : [])
      .concat(oneriListesi(false).filter(o => !(kars.kartlar.length && /istatistiklerim$/.test(o.is)))).slice(0, 2);
    const hazirlar = oneriler.map(o => '<button type="button" class="king__cip king__hazir" data-king="' + o.is + '">' + kac(o.ad) + '</button>').join('')
      + HAZIR.map((h, i) => ({ h, i })).filter(({ h }) => !(h.ozet && kars.satirlar.length)).sort((a, b) => (a.h.ozet - b.h.ozet)
          || ((b.h.modul === (ayar && ayar.modul)) - (a.h.modul === (ayar && ayar.modul))) || a.i - b.i)
          .map(({ h, i }) => '<button type="button" class="king__cip king__hazir" data-king-hazir="' + i + '">'
          + NOKTA(h.ozet ? (ayar && ayar.modul) : h.modul) + kac(h.ad) + '</button>').join('');
    const bos = '<div class="king__bos"><span class="king__bos-kure" aria-hidden="true">' + KURE + '</span>'
      + '<h2 class="king__bos-selam">' + kac(selam()) + '</h2>'
      + (kars.kartlar.length || kars.satirlar.length
        ? (kars.kartlar.length ? '<div class="king__bos-veri">' + kartlarHtml(kars) + '</div>' : '')
          + (kars.satirlar.length ? '<ul class="king__bos-ozet">' + kars.satirlar.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : '')
        : '<p class="king__bos-alt">Yaz, konuş ya da ekranını göster. Kaydetmeden önce her zaman sorarım.</p>')
      + '<div class="king__hazirlar" role="group" aria-label="Hazır cevaplar">' + hazirlar + '</div>'
      + '<div class="king__bos-araclar kv-izgara' + (kvGiris ? ' is-giris' : '') + '" role="group" aria-label="Kartlarım">' + oneCikanlar().map((x, i) => miniKutu(x, i)).join('')
      + '<button type="button" class="kv-mini kv-mini--tumu" style="--i:' + oneCikanlar().length + '" data-king="bolum:araclar" title="Bütün araçlar" aria-label="Bütün araçlar">'
      + '<span class="kv-mini-simge" aria-hidden="true"><svg viewBox="0 0 24 24">' + GRUP_SVG_MODUL + '</svg></span><span class="kv-mini-ad">Tümü</span></button></div></div>';
    const balonlar = satirlar.map((m, i) => m.kim === 'sen'
      ? (m.foto ? '<div class="king__balon king__balon--sen king__balon--foto"><img class="king__foto" src="' + kac(m.foto) + '" alt="Gönderdiğin fotoğraf"/></div>'
        : '<div class="king__balon king__balon--sen"><p>' + kac(m.metin) + '</p>'
          + (m.sira ? '<small class="king__siradan">sıradan · ' + kac(tarihYaz(m.sira)) + '</small>' : '') + '</div>')
      : m.bekliyor
      ? '<div class="king__balon king__balon--king is-bekliyor" role="status" aria-label="King düşünüyor">'
        + '<div class="king__dusun" aria-hidden="true"><i></i><i></i><i></i></div></div>'
      : '<div class="king__balon king__balon--king' + (m.yeni ? ' is-yeni' : '') + (m.akiyor ? ' is-akiyor' : '') + (m.bulgu ? ' king__balon--bulgu' : '') + '"><div><p>' + bicimli(m.metin) + '</p>'
        + kartlarHtml(m) + yapHtml(m) + nefesHtml(m) + yasaHtml(m, ilkSira + i) + gunKartHtml(m, ilkSira + i) + dersHtml(m, ilkSira + i) + soruHtml(m, ilkSira + i) + siraliHtml(m, ilkSira + i) + bulunanHtml(m, ilkSira + i) + arastirmaHtml(m, ilkSira + i) + k2Html(m, ilkSira + i)
        + (m.onizleme
          ? '<div class="king__onizle"><span class="king__onizle-ad">Eklenecek</span>'
            + (m.onizleme.liste ? '<ul class="king__liste">' + m.onizleme.liste.map(x => '<li><b>' + kac(x) + '</b></li>').join('') + '</ul>'
              : '<b>' + kac(m.onizleme.metin) + '</b>')
            + (m.onizleme.ipucu ? '<small>' + kac(m.onizleme.ipucu) + '</small>' : '') + '</div>'
          : (m.satirlar && m.satirlar.length ? '<ul>' + m.satirlar.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul>' : ''))
        + (m.son ? '<p class="king__son">' + kac(m.son) + '</p>' : '')
        + nedenHtml(m)
        + '</div>' + (akis.length ? '<button type="button" class="king__kopyala" data-king="kopyala-mesaj:' + (ilkSira + i)
          + '" aria-label="Cevabı kopyala" title="Kopyala"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/>'
          + '<path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg></button>' : '') + '</div>').join('');
    const cip = cipler
      ? cipler.map(c => '<button type="button" class="king__cip' + (c.is === 'kaydet' || c.is === 'ilet' || /^foto:0$/.test(c.is) || (c.is === 'foto-yorum' && !/foto:0/.test(JSON.stringify(cipler))) ? ' king__cip--ana' : '')
          + '" data-king="' + c.is + '">' + kac(c.ad) + '</button>').join('')
      /* Hazır cevaplar yalnız boş sohbette, ortada (bos). */
      : '';
    /* G: mikrofon — dokun: söyle, yazıya dökülsün; basılı tut: sesli sohbet. */
    const mik = konusabilir()
      ? '<button type="button" class="king__mik' + (dinleyen ? ' is-acik' : '') + (sesliSohbet ? ' is-sohbet' : '') + '" data-king="dinle" aria-pressed="'
        + (dinleyen ? 'true' : 'false') + '" aria-label="' + (dinleyen ? 'Dinlemeyi bitir' : 'Konuşarak sor; basılı tutunca sesli sohbet')
        + '" title="Dokun: söyle · Basılı tut: sesli sohbet"><svg viewBox="0 0 24 24" aria-hidden="true">'
        + '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>'
      : '';
    return yan + bas
      /* Hazır cevaplar son cevabın hemen altında, küçük (2026-10-19,
         kullanıcı: «çok aşağıda; daha minimalist bir yere»). */
      + '<div class="king__akis" aria-live="polite">' + (vitrin ? (bolum === 'kutuphane' ? kutuphaneHtml() : vitrinHtml()) : akis.length ? balonlar : bos)
      + (cip && !vitrin ? '<div class="king__cipler king__cipler--akis" role="group" aria-label="Hazır cevaplar">' + cip + '</div>' : '') + '</div>'
      + kipPanel()
      + '<form class="king__yaz" data-king-form data-ayar-disi>' + arkadasHtml()
      + '<div class="king__arti-yer"><button type="button" class="king__arti' + (aracAcik ? ' is-acik' : '') + '" data-king="arac" aria-expanded="' + (aracAcik ? 'true' : 'false')
      + '" aria-haspopup="menu" aria-label="Ekle" title="Ekle: fotoğraf, kamera, ekran, PDF, barkod">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>' + aracMenu() + '</div>'
      + '<input type="file" accept="image/*" data-king-dosya class="sr-only"/>'
      + '<input type="file" accept="application/pdf,.pdf" data-king-pdf class="sr-only"/>'
      + '<input class="king__girdi" type="text" aria-label="King\'e yaz" placeholder="' + (dinleyen ? 'Dinliyorum…' : kip() === 'ekran' ? 'Ekran hakkında sor…' : kip() === 'kamera' ? 'Kameradakini sor…' : 'King\'e yaz…') + '" autocomplete="off" enterkeyhint="send"/>'
      + mik
      + '<button type="submit" class="king__gonder" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button></form></div>' + alan;
  }
  /* «Neden?» (G; K6 dolduracak): önerinin altında, yalnız bilinen kaynak. */
  function nedenSatirlari(m){
    const ad = MODUL_AD[ayar && ayar.modul] || 'Modül';
    const l = [];
    if(Array.isArray(m.neden)) m.neden.forEach(x => { if(x) l.push(String(x)); });
    else if(m.neden) l.push(String(m.neden));
    if(m.kartlar && m.kartlar.length) l.push('Sayıları ' + ad + ' kendi koduyla hesaplar; her kart etiketini taşır (ölçüldü, hesaplandı, tahmin, veri yok).');
    if(m.sirali && m.sirali.length) l.push('Sırayı ' + ad + ' kendi öncelik kuralıyla kurar; King yalnız gösterir.');
    if(m.arastirma) l.push('Özet ve öneri ' + (m.arastirma.izle.length + m.arastirma.oku.length) + ' kaynaktan; her bağlantı kaynağın kendisine gider.');
    if(m.onizleme) l.push('Kaydı ' + ad + '’nin kendi ayrıştırıcısı okudu; sen onaylamadan yazılmaz.');
    return l;
  }
  function nedenHtml(m){
    const l = nedenSatirlari(m);
    if(!l.length) return '';
    return '<details class="king__neden" data-king-neden><summary>Neden?</summary><ul>' + l.map(x => '<li>' + kac(x) + '</li>').join('') + '</ul></details>';
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
    /* Yazılmakta olan metin çizimden sağ çıkar (küçükken ekran değişince,
       küçült/büyüt arasında siliniyordu). Gönderim kutuyu önce boşaltır. */
    const taslak = (kutu.querySelector('.king__girdi') || {}).value || '';
    kutu.innerHTML = govde();
    k.classList.toggle('is-yan-acik', !mini && yanAcik);
    k.classList.toggle('is-yan-dar', !mini && yanDar());
    k.classList.toggle('is-dizin', !mini && (bolum === 'araclar' || bolum === 'kutuphane'));
    const vitrinIlk = kvGiris && (bolum === 'araclar' || bolum === 'kutuphane');
    kvGiris = false;                                   // kartların girişi bir kez oynar
    k.classList.toggle('is-alan-acik', !mini && !!kutu.querySelector('.king__alan'));
    const g = kutu.querySelector('.king__girdi');
    if(g && doldurulacak){ g.value = doldurulacak; doldurulacak = ''; }   // söz 37: işin örnek cümlesi
    else if(g && taslak) g.value = taslak;
    const akisEl = kutu.querySelector('.king__akis');
    /* Araçlar: açılınca baştan; düzenlerken yerinde kalır. */
    if(akisEl) akisEl.scrollTop = (bolum === 'araclar' || bolum === 'kutuphane') ? (vitrinIlk ? 0 : yer) : (altta || yeniVar) ? akisEl.scrollHeight : yer;
    /* Söz 27: paylaşılan ekranın canlı önizlemesi (aynı video öğesi taşınır). */
    const onz = kutu.querySelector('[data-king-onizle]');
    if(onz && paylasim && paylasim.video && paylasim.video.nodeType === 1){
      paylasim.video.className = 'king__ekran-video';
      paylasim.video.setAttribute('aria-hidden', 'true');
      onz.appendChild(paylasim.video);
    }
    if(yeniVar){ arkadasKonus = Date.now() + 1800; setTimeout(arkadasGuncelle, 1900); }
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
    else if(!mini){ bekleyenleriSun(); tanismaHazirla(); kutuyuSun(); }   // söz 22: günde en çok bir soru (çıkarım Onaylar'da, söz 23)
    const el = document.createElement('div');
    el.className = 'king';
    el.setAttribute('data-king', '');
    /* Perde: arka plan hafifçe kararır (odak baloncukta); dokununca kapanır. */
    el.innerHTML = '<div class="king-perde" aria-hidden="true"></div><div class="king-isik" aria-hidden="true"></div>'
      + '<div class="king__kutu" role="dialog" aria-modal="false" aria-label="King ile konuş"></div>';
    if(mini) el.classList.add('is-mini');
    document.body.appendChild(el);
    /* Arkadaş: yazınca ve fare kıpırdayınca uyanır; boşta kalınca uyur; dokununca kıkırdar. */
    arkadasSon = Date.now();
    ['input', 'keydown', 'pointerdown'].forEach(t => el.addEventListener(t, arkadasUyandir));
    el.addEventListener('click', e => {
      const m = e.target && e.target.closest ? e.target.closest('.king__arkadas .minik') : null;
      if(!m) return;
      m.classList.add('is-gidik'); setTimeout(() => m.classList.remove('is-gidik'), 1100);
      try{ if(L.SES) L.SES.tik('gidik', true, { perde:0.95 }); }catch(x){ /* ses yok */ }
    });
    clearInterval(arkadasAralik);
    arkadasAralik = setInterval(arkadasGuncelle, 5000);
    isPlanla(800);                               // K1: işler; King açıkken yoklanır
    ortam.zamanla(() => { siraBosalt(); siraPlanla(); }, 1200);   // K4: Merkez sırası
    tasimaYaz();
    cubukIsaretle();
    document.documentElement.classList.add(mini ? 'king-mini' : 'king-acik');
    ciz(mini ? false : undefined);
    kamTazele();                                 // Kamera kipi yalnız kamera varsa görünür
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
    paylasimKapat();                             // küçük kutu kamerayı ve ekranı tutmaz
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
    sesliSohbet = false; uyanTur = false; bekleyenFoto = null; menu = null; silOnay = null; mikNot = '';
    if(isZaman){ clearTimeout(isZaman); isZaman = null; }   // K1: King kapalıyken yoklama yok
    ortam.depo.sil(TASIMA);
    paylasimKapat();
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

  let bagli = false, sonCtrl = 0, baskaTus = false, basili = null, mikBasili = null;
  /* Sayfa gizlenince kamera durur; ekran paylaşımı sürer (paylaşılan pencereye
     geçmek sayfayı gizler, işin kendisi budur). Sayfa kapanınca ikisi de durur. */
  function gorunurluk(){
    if(!kameraMi() || !ortam.gizli()) return;
    paylasimKapat();
    if(acik) ciz(false);
  }
  function bagla(){
    if(bagli || typeof document === 'undefined') return;
    bagli = true;
    document.addEventListener('visibilitychange', gorunurluk);
    if(typeof window !== 'undefined') window.addEventListener('pagehide', () => { paylasimKapat(); });
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
      /* G: dar ekranda çalışma alanı sohbetin üstünde katman; sohbetin boş yerine dokununca kapanır. */
      if(menu && !mini && !ortam.genis() && t.closest('.king__ana') && !t.closest('[data-king]:not(.king)')){ menu = null; ciz(false); return; }
      const k = t.closest('[data-king]');
      if(!k){ if(acik && !mini) kucult(); return; }
      if(konusuyor > 0 && t.closest('.king__kure')){ sus(); return; }
      /* Vitrin: kartın eylemi sohbete döner ve orada çalışır. */
      if(t.closest('[data-king-sohbete]') && bolum === 'kutuphane'){ bolum = 'sohbet'; kvGiris = true; if(!ortam.genis()) yanAcik = false; }
      const vk = t.closest('[data-king-vitrin] [data-king]');
      if(vk && bolum === 'araclar' && !/^kv-/.test(vk.getAttribute('data-king'))){ bolum = 'sohbet'; kvGiris = true; if(!ortam.genis()) yanAcik = false; }
      /* Araçlar: dar ekranda liste sohbetin üstünde; seçince kapanır, sonuç görünür. */
      if(t.closest('[data-king-araclar] [data-king]') && !ortam.genis()) yanAcik = false;
      const h = t.closest('[data-king-hazir]');
      if(h){ hazirSec(Number(h.getAttribute('data-king-hazir'))); return; }
      const c = t.closest('[data-king]:not(.king)');
      if(c){
        const is = c.getAttribute('data-king');
        if(aracAcik && is !== 'arac') aracAcik = false;          // söz 27: menüden seçince kapanır
        if(kipAcik && is !== 'kipler') kipAcik = false;           // kip menüsü de aynı kural
        if(is === 'kipler'){ kipAcik = !kipAcik; aracAcik = false; ciz(false); if(kipAcik) kamTazele(); return; }
        /* G: ray, çalışma alanı, «+» menüsündeki yeni satırlar. */
        if(/^bolum:[a-z]+$/.test(is)){ bolumSec(is.slice(6)); return; }
        if(/^doldur:/.test(is)){ doldurulacak = is.slice(7); ciz(true); return; }
        if(is === 'alan-kapat'){ menu = null; silOnay = null; ciz(false); return; }
        if(is === 'onizle-buyut'){ alanAc('onizle'); return; }
        if(/^ars-ac:\d+$/.test(is)){ alanAc('ars:' + is.slice(7)); return; }
        if(is === 'pdf-sec'){ const f = document.querySelector('[data-king-pdf]'); if(f) f.click(); return; }
        if(is === 'barkod'){ const n = barkodNo(); if(n >= 0) isSec(n); else ciz(false); return; }
        if(/^oner-metin:/.test(is)){ isle(is.slice(11)); return; }
        if(/^bul-sec:\d+:\d+$/.test(is)){ const p = is.split(':'), m = akis[Number(p[1])], o = m && m.bulunan && m.bulunan.ogeler[Number(p[2])];
          if(o && o.durum === 'bekliyor'){ o.secili = !o.secili; ciz(false); } return; }
        if(/^bul-kaydet:\d+$/.test(is)){ bulunanKaydet(Number(is.slice(11))); return; }
        if(/^bul-vazgec:\d+$/.test(is)){ const m = akis[Number(is.slice(11))];
          if(m && m.bulunan){ m.bulunan.ogeler.forEach(o => { if(o.durum === 'bekliyor'){ o.durum = 'vazgecildi'; delete bulunanIs[o.id]; } }); m.bulunan.bitti = true; sakla(); soyle('Tamam, hiçbirini kaydetmedim.'); } return; }
        if(/^bul-git:(ays|spi|esp):/.test(is)){ const p = is.split(':'); cipler = null; git({ modul:p[1], route:p[2] || 'today' }); return; }
        if(/^sira-ac:\d+:\d+$/.test(is)){ const p = is.split(':'), m = akis[Number(p[1])], x = m && m.sirali && m.sirali[Number(p[2])];
          if(x && ayar.kartlar && ayar.kartlar.oncelikAc){ kucult(); Promise.resolve(ayar.kartlar.oncelikAc(x.ham || x)).catch(() => {}); } return; }
        if(is === 'defter-ac'){ const Df = D(); if(Df){ kucult(); try{ Df.ac(); }catch(e){ /* açılamadı */ } } return; }
        if(/^gunluk-his:[0-5]$/.test(is)){ if(gunlukBekle && gunlukMetin) gunlukBitir(Number(is.slice(11))); return; }
        if(/^deney-olcu:/.test(is)){ deneyOlcuSec(is.slice(11)); return; }
        if(/^tarz:(samimi|resmi|kisa)$/.test(is)){ tarzSec(is.slice(5)); return; }
        if(is === 'odak-dur'){ odakDur(); return; }
        if(/^odak-kaydet:\d+:/.test(is)){ const p = is.split(':'); cipler = null; isle(p[1] + ' dk ' + (decodeURIComponent(p.slice(2).join(':')) || 'çalıştım')); return; }
        if(/^soru-cevap:\d+:[A-E]$/.test(is)){ const p = is.split(':'); soruCevapla(Number(p[1]), p[2]); return; }
        if(/^sozet-dinle:\d+$/.test(is)){ const x = sozetler()[Number(is.slice(12))]; if(x) seslendir(sozetMetni(x)); return; }
        if(/^sira-sil:\d+$/.test(is)){ const l = sira(); l.splice(Number(is.slice(9)), 1); siraYaz(l); ciz(false); return; }
        if(/^ders-(ileri|geri):\d+$/.test(is)){ const p = is.split(':'); dersAdim(Number(p[1]), p[0] === 'ders-ileri' ? 1 : -1); return; }
        if(/^ders-soru:\d+$/.test(is)){ const m = akis[Number(is.slice(10))];
          if(m && m.ders && m.ders.kd){ cipler = null; kdSoru(m.ders.id); return; }
          if(m && m.ders) isle('bana soru sor ' + m.ders.sorgu); return; }
        if(/^yap:/.test(is)){ const l = yapilacaklar(), x = l.find(y => y.id === is.slice(4)); if(x){ x.bitti = !x.bitti; yapYaz(l); ciz(false); } return; }
        if(/^hat-sil:/.test(is)){ hatirYaz(hatirlatmalar().filter(x => x.id !== is.slice(8))); cipler = null; soyle('Hatırlatmayı iptal ettim.'); hatirlatKur(); return; }
        if(/^yasa-deney:\d+:\d+$/.test(is)){ const p = is.split(':'), m = akis[Number(p[1])], y = m && m.yasa && m.yasa.l[Number(p[2])];
          if(y) isle('deney başlat: ' + y.deney); return; }
        if(/^gun-baslat:\d+:\d+$/.test(is)){ const p = is.split(':'), m = akis[Number(p[1])], x = m && m.gun && m.gun.ogeler[Number(p[2])];
          if(x){ cipler = null; odakBaslat(x.dk || 25, x.ad); soyle((x.dk || 25) + ' dakikalık odak başladı (' + x.ad + '). Süre dolunca haber vereceğim.'); } return; }
        if(/^gun-ac:\d+:\d+$/.test(is)){ const p = is.split(':'), m = akis[Number(p[1])], x = m && m.gun && m.gun.ogeler[Number(p[2])];
          if(x && x.route){ cipler = null; git({ modul:m.gun.modul, route:x.route }); } return; }
        if(is === 'derse-cevir'){ if(kaynakMetin){ cipler = null; derseCevir(kaynakMetin.metin, kaynakMetin.ad); } return; }
        if(/^kd-ac:\d+$/.test(is)){ const d = kdDersler()[Number(is.slice(6))]; if(d){ cipler = null; soyle(d.baslik + ' · ders', null, null, null, { ders:kdDersMesaji(d) }); } return; }
        if(/^kut-filtre:[a-z]+$/.test(is)){ kutFiltre = is.slice(11); kutBuyuk = null; if(bolum !== 'kutuphane') bolum = 'kutuphane'; if(!ortam.genis()) yanAcik = false; ciz(false); return; }
        if(/^gorsel-buyut:/.test(is)){ kutBuyuk = is.slice(13) || null; ciz(false); return; }
        if(/^gorsel-sil:/.test(is)){ ortam.depo.yaz(GORSEL, gorseller().filter(x => x.id !== is.slice(11))); kutBuyuk = null; ciz(false); return; }
        if(is === 'kv-duzen'){ kvDuzen = !kvDuzen; kvSecili = null; kvYeni = false; ciz(false); return; }
        if(is === 'kv-yeni'){ const g = document.querySelector('.king__girdi'); kvTaslak = g ? g.value.trim() : ''; kvYeni = true; kvSecili = null; ciz(false);
          const a = document.querySelector('[data-king-kv-form] [name="ad"]'); if(a) try{ a.focus({ preventScroll:true }); a.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(e){ /* eski tarayıcı */ } return; }
        if(is === 'kv-yeni-kapat'){ kvYeni = false; ciz(false); return; }
        if(/^kv-sec:/.test(is)){ const x = is.slice(7); kvSecili = x && kvSecili !== x ? x : null; ciz(false); return; }
        if(/^kv-sabit:/.test(is)){ kartSabitle(is.slice(9)); ciz(false); return; }
        if(/^kv-renk:/.test(is)){ kartSus(kvSecili, 'renk', is.slice(8)); ciz(false); return; }
        if(/^kv-emoji:/.test(is)){ kartSus(kvSecili, 'emoji', is.slice(9)); ciz(false); return; }
        if(/^kv-tasi:-?1$/.test(is)){ kartTasi(kvSecili, Number(is.slice(8))); ciz(false); return; }
        if(/^kv-sil:/.test(is)){ kartSil(is.slice(7)); kvSecili = null; ciz(false); return; }
        if(is === 'kv-varsayilan'){ kartSus(kvSecili, 'renk', ''); kartSus(kvSecili, 'emoji', ''); ciz(false); return; }
        if(is === 'kv-sifirla'){ const A = kartAyar(); A.sabit = null; kartYaz(A); ciz(false); return; }
        if(/^vitrin-git:\d+$/.test(is)){ const el = document.getElementById('kv-' + is.slice(11)); if(el) try{ el.scrollIntoView({ block:'start', behavior:'smooth' }); }catch(e){ /* eski tarayıcı */ } return; }
        if(/^ders-tekrar:\d+$/.test(is)){ dersTekrar(Number(is.slice(12))); return; }
        if(/^ders-dinle:\d+$/.test(is)){ const m = akis[Number(is.slice(11))], b = m && m.ders && m.ders.bolumler[m.ders.adim];
          if(b) seslendir([b.baslik, b.metin].concat(b.liste, b.dikkat ? ['Dikkat. ' + b.dikkat] : []).filter(Boolean).join('. ').replace(/\*\*/g, '')); return; }
        if(/^ders-ac:\d+$/.test(is)){ const m = akis[Number(is.slice(8))], K = ayar && ayar.kartlar;
          if(m && m.ders && K && K.dersAc){ kucult(); Promise.resolve(K.dersAc(m.ders.id)).catch(() => {}); } return; }
        if(/^soru-yeni:\d+$/.test(is)){ const m = akis[Number(is.slice(10))]; isle('bana bir soru daha sor' + (m && m.soru && m.soru.sorgu ? ' ' + m.soru.sorgu : '')); return; }
        if(/^derinlik:(oto|hizli|dengeli|derin)$/.test(is)){ derinlikSec(is.slice(9)); return; }
        if(is === 'kapat'){ sesli = false; kapat(); return; }
        if(is === 'dinle'){ if(mikBasili === 'oldu'){ mikBasili = null; return; } dinle(); return; }
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
        if(is === 'ekip-ac'){ if(mini) buyut(); cipler = null; ekipAc(); return; }
        if(/^is-iptal:\d+$/.test(is)){ isIptal(Number(is.slice(9))); return; }
        if(/^gorev-onayla:\d+$/.test(is)){ gorevEylem(Number(is.slice(13)), 'onayla'); return; }
        if(/^gorev-iptal:\d+$/.test(is)){ const id = Number(is.slice(12));
          if(gorevIptalOnay === id) gorevEylem(id, 'iptal'); else { gorevIptalOnay = id; ciz(false); } return; }
        if(is === 'uyan:0' || is === 'uyan:1'){ uyanSec(is === 'uyan:1'); return; }
        if(is === 'beceri-ac'){ if(mini) buyut(); cipler = null; beceriAc(); return; }
        if(/^beceri-(ac|kapat):\d+$/.test(is)){ const p = is.split(':'); beceriYap(Number(p[1]), p[0].slice(7)); return; }
        if(/^beceri-sil:\d+$/.test(is)){ const id = Number(is.slice(11));
          if(beceriSilOnay === id) beceriYap(id, 'sil'); else { beceriSilOnay = id; ciz(false); } return; }
        if(/^beceri-duzelt:\d+$/.test(is)){ const id = Number(is.slice(14)); beceriDuzelt = id || null; beceriSilOnay = null; ciz(false);
          const g = document.querySelector('[data-king-beceri-form] [name="ad"]'); if(g) try{ g.focus(); }catch(e){} return; }
        if(/^soz-sil:\d+$/.test(is)){ sozSil(Number(is.slice(8))); return; }
        if(/^k2-soz:\d+:\d+$/.test(is)){ const p = is.split(':'); sozSil(Number(p[1]), Number(p[2])); return; }
        if(/^k2-cevap:\d+:\d+$/.test(is)){ const p = is.split(':'); cevapGeri(Number(p[1]), Number(p[2])); return; }
        if(is === 'beceri-arac'){ const x = bekleyenArac; bekleyenArac = null; cipler = null; if(x) aracIsle({ arac:[x] }, ''); else ciz(false); return; }
        if(is === 'kayitlar'){ menuAc('kayitlar'); return; }
        if(is === 'yeni-sohbet'){ yeniSohbet(); return; }
        if(/^kip:(yaz|dinle|konus|ekran|kamera)$/.test(is)){ aracAcik = false; kipSec(is.slice(4)).then(() => ciz(false)); return; }
        if(is === 'arac'){ aracAcik = !aracAcik; aracSayfa = null; ciz(false); return; }
        if(is === 'isler' || is === 'isler-geri'){ aracAcik = true; aracSayfa = is === 'isler' ? 'isler' : null; ciz(false); return; }
        if(/^is-sec:\d+$/.test(is)){ aracSayfa = null; isSec(Number(is.slice(7))); return; }
        if(/^kam-is:\d+$/.test(is)){ kameraIs(Number(is.slice(7))); return; }
        if(/^ars-dinle:\d+$/.test(is)){ const a = akis[Number(is.slice(10))] && akis[Number(is.slice(10))].arastirma; if(a && a.ozet) seslendir(a.ozet); return; }
        if(/^ars-ekle:\d+$/.test(is)){ arastirmaEkle(Number(is.slice(9))); return; }
        if(is === 'is-kamera'){ isKamera(); return; }
        if(is === 'sus'){ sus(); return; }
        if(is === 'ekran-sor'){ isle('Ekranda ne görüyorsun? Kısaca söyle.'); return; }
        if(is === 'kamera-sor'){ isle('Kamerada ne görüyorsun? Kısaca söyle.'); return; }
        if(is === 'ekran-ses'){ sesliSohbetAc(); ciz(false); return; }
        if(is === 'goz:0' || is === 'goz:1'){ gozSec(is === 'goz:1'); return; }
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
        if(/^algila:/.test(is)){ const v = is.slice(7); if(ALGILA_TERCIH.indexOf(v) >= 0){ if(v === 'oto') ortam.depo.sil(ALGILA); else ortam.depo.yaz(ALGILA, v); hkmDinlemezBitis = 0; } ciz(false); return; }
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
      if(e.target && e.target.matches && e.target.matches('[data-king-kam]')){ kamSec(e.target.value); return; }
      if(e.target && e.target.matches && e.target.matches('[data-king-pdf]')){
        const p = e.target.files && e.target.files[0];
        if(p) pdfAl(p);
        e.target.value = '';
        return;
      }
      const d = e.target && e.target.matches && e.target.matches('[data-king-dosya]') ? e.target : null;
      if(!d) return;
      const f = d.files && d.files[0];
      if(f) fotoAl(f);
      d.value = '';
    }, true);
    /* K4: cihaz yeniden çevrimiçi olunca Merkez sırası. */
    if(typeof window !== 'undefined' && window.addEventListener) window.addEventListener('online', () => { siraBosalt(); });
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
    /* K2: becerinin düzeltme formu. */
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-beceri-form]') : null;
      if(!f) return;
      e.preventDefault();
      beceriKaydet(Number(f.getAttribute('data-king-beceri-form')), f);
    });
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
    document.addEventListener('submit', e => {
      const f = e.target && e.target.closest ? e.target.closest('[data-king-kv-form]') : null;
      if(!f) return;
      e.preventDefault();
      const ad = f.querySelector('[name="ad"]'), mt = f.querySelector('[name="metin"]'), gn = f.querySelector('[name="gonder"]:checked');
      if(!ad || !mt || !ad.value.trim() || !mt.value.trim()) return;
      const id = kartEkle(ad.value, mt.value, !gn || gn.value === '1');
      kvYeni = false; kvTaslak = ''; kvDuzen = true; kvSecili = 'o:' + id; ciz(false);
    });
    document.addEventListener('change', e => {
      const t = e.target && e.target.matches && e.target.matches('[data-king-kt-tasi]') ? e.target : null;
      if(t){ kayitTasi(t.getAttribute('data-king-kt-tasi'), t.value || null); ciz(false); }
    });
    document.addEventListener('change', e => {
      const g = e.target && e.target.matches && e.target.matches('[data-king-kv-emoji]') ? e.target : null;
      if(!g || !kvSecili) return;
      kartSus(kvSecili, 'emoji', [...g.value.trim()].slice(0, 4).join('')); ciz(false);
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
    /* G: mikrofona basılı tutmak sesli sohbeti açar; bırakınca gelen tık dinlemeyi başlatmaz. */
    document.addEventListener('pointerdown', e => {
      const m = acik && e.target && e.target.closest ? e.target.closest('.king__mik') : null;
      if(!m || (e.button != null && e.button !== 0)) return;
      if(mikBasili && mikBasili !== 'oldu') clearTimeout(mikBasili);
      mikBasili = setTimeout(() => { mikBasili = 'oldu'; if(!sesliSohbet) kipSec('konus').then(() => ciz(false)); }, 450);
    }, true);
    const mikBirak = () => {
      if(mikBasili === 'oldu') setTimeout(() => { if(mikBasili === 'oldu') mikBasili = null; }, 400);   // tık gelmezse de unutulur
      else if(mikBasili){ clearTimeout(mikBasili); mikBasili = null; }
    };
    document.addEventListener('pointerup', mikBirak, true);
    document.addEventListener('pointercancel', mikBirak, true);
    document.addEventListener('contextmenu', e => { if(acik && e.target && e.target.closest && e.target.closest('.king__mik')) e.preventDefault(); }, true);
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
  /* ------------------------------------------------------- King 3.0 K1: ekip, işler, görevler */
  /* Veri HKM'den gelir (/api/king/isler, /api/king/gorevler; belgeler/ekip/KING-EKIP.md).
     Sayıyı ve durumu HKM'nin kodu yazar; burada yalnız çizilir. Yoklama yalnız
     King açıkken: açık iş varken 5 sn'de, yokken 20 sn'de bir; King kapalıyken hiç. */
  const AJAN_AD = { akademik:'Akademik', beden:'Beden', zihin:'Zihin', arastirmaci:'Araştırmacı' };
  const ACIK_IS = ['bekliyor', 'calisiyor'];
  let isDurum = null;                 // HKM'nin ekran satırı ({ acik, metin, … }); boşken null
  let isZaman = null;                 // sonraki yoklamanın zamanlayıcısı
  let izlenen = {};                   // açık görülen işler: id → true (bitince haber verilir)
  let ekip = { isler:[], gorevler:[], yuklu:false };
  let gorevIptalOnay = null;          // iptali sorulan görevin kimliği
  async function kingIstek(yol, yontem){
    const k = baglanti();
    if(!k) return null;
    try{
      const o = { headers:{ 'Authorization':'Bearer ' + k.token } };
      if(yontem === 'POST'){ o.method = 'POST'; o.headers['Content-Type'] = 'application/json'; o.body = '{}'; }
      const res = await ortam.fetch(k.url + yol, o);
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      return { status:res.status, g };
    }catch(e){ return null; }
  }
  function isAjanAd(i){ return (i && i.sonuc && i.sonuc.ad) || AJAN_AD[i && i.ajan] || 'Ekip'; }
  /* Biten işin kısa haberi: sohbet akışına King'in sözü (okunmaz), uygulama
     arkadaysa sistem bildirimi. İptal edilen iş haber edilmez (kullanıcı yaptı). */
  function isBitti(i){
    if(i.durum === 'iptal') return;
    const ad = isAjanAd(i), ozet = String((i.sonuc && i.sonuc.ozet) || '').trim();
    let metin;
    if(i.durum === 'hata') metin = '«' + i.baslik + '» yarıda kaldı (' + ad + ')' + (i.hata ? ': ' + i.hata : '.');
    else if(i.tur === 'gorev_adim') metin = 'Görev adımı bitti: «' + i.baslik + '» (' + ad + ').' + (ozet ? '\n' + ozet : '');
    else metin = ad + ' raporu (iş #' + i.id + '): ' + (ozet || 'rapor boş geldi.');
    const kaynak = (i.sonuc && Array.isArray(i.sonuc.kaynaklar) ? i.sonuc.kaynaklar : [])
      .filter(x => x && LINK_RE.test(String(x.url || ''))).slice(0, 5);
    if(kaynak.length) metin += '\n' + kaynak.map(x => '• ' + String(x.baslik || x.url).replace(/\s+/g, ' ').slice(0, 90) + ' ' + x.url).join('\n');
    if(i.sonuc && i.sonuc.etiket) metin += '\n(' + i.sonuc.etiket + ')';
    akis.forEach(m => { m.yeni = false; });
    akis.push({ kim:'king', metin, yeni:true, bulgu:true });
    akis = akis.slice(-GUNLUK_EN_COK);
    sakla();
    if(ortam.gizli()) ortam.bildir('King', metin.split('\n')[0]);
  }
  async function isYokla(){
    if(isZaman){ clearTimeout(isZaman); isZaman = null; }
    if(!acik) return;
    const r = baglanti() ? await kingIstek('/api/king/isler?limit=12') : null;
    if(!acik) return;
    const v = r && r.status === 200 && r.g ? r.g : null;
    const isler = v && Array.isArray(v.isler) ? v.isler.filter(i => i && i.id != null) : null;
    const yeni = v && v.durum && v.durum.acik ? v.durum : null;
    let degisti = JSON.stringify(yeni) !== JSON.stringify(isDurum);
    isDurum = yeni;
    if(isler){
      isler.forEach(i => {
        if(ACIK_IS.indexOf(i.durum) >= 0) izlenen[i.id] = true;
        else if(izlenen[i.id]){ delete izlenen[i.id]; isBitti(i); degisti = true; }
      });
      if(menu === 'ekip' || bolum === 'gorev'){ ekip.isler = isler; degisti = true; }
    }
    if(menu === 'ekip' || bolum === 'gorev'){
      const gr = await kingIstek('/api/king/gorevler');
      if(gr && gr.status === 200 && gr.g && Array.isArray(gr.g.gorevler)){ ekip.gorevler = gr.g.gorevler; ekip.yuklu = true; }
      else if(bolum === 'gorev' && menu !== 'ekip'){ ekip.yuklu = true; degisti = true; }
    }
    if(degisti && acik) ciz(false);
    /* K2: bekleyen mesajlar King açılınca ve dakikada bir. */
    if(acik && baglanti() && ortam.simdi().getTime() - bekleyenSon >= 55000) await bekleyenAl();
    isPlanla(isDurum ? 5000 : 20000);
  }
  function isPlanla(ms){
    if(isZaman) clearTimeout(isZaman);
    isZaman = acik && baglanti() && typeof setTimeout === 'function' ? setTimeout(isYokla, ms) : null;
  }
  async function ekipAc(){
    gorevIptalOnay = null;
    alanAc('ekip');
    await isYokla();
    ekip.yuklu = true;
    if(acik && menu === 'ekip') ciz(false);
  }
  async function isIptal(id){
    await kingIstek('/api/king/is/' + id + '/iptal', 'POST');
    await isYokla();
  }
  async function gorevEylem(id, eylem){
    gorevIptalOnay = null;
    const r = await kingIstek('/api/king/gorev/' + id + '/' + eylem, 'POST');
    if(!r || r.status !== 200){ soyle(eylem === 'onayla' ? 'Görevi başlatamadım; Merkez cevap vermedi.' : 'Görevi iptal edemedim; Merkez cevap vermedi.'); return; }
    menu = 'ekip';
    await isYokla();
  }
  function isRozet(){
    if(!isDurum || !(isDurum.acik > 0)) return '';
    /* G: başlıkta kısa «2 iş»; cümlesi aria-label'da ve ipucunda. */
    return '<button type="button" class="king__is-rozet" data-king="ekip-ac" title="' + kac(isDurum.metin || '') + '" aria-label="King şu an '
      + kac(isDurum.acik) + ' iş yapıyor. İşleri göster"><i class="king__is-nabiz" aria-hidden="true"></i>' + kac(isDurum.acik) + ' iş</button>';
  }
  /* İnce ilerleme çubuğu (AGENTS §10): yüzde HKM'nin; sayı aria-label'da cümleyle. */
  function cubukHtml(yuzde, etiket){
    const y = Math.max(0, Math.min(100, Math.round(Number(yuzde) || 0)));
    return '<svg class="king__cubuk" viewBox="0 0 100 4" preserveAspectRatio="none" role="img" aria-label="' + kac(etiket) + '">'
      + '<rect class="king__cubuk-zemin" width="100" height="4" rx="2"/>' + (y ? '<rect class="king__cubuk-dolu" width="' + y + '" height="4" rx="2"/>' : '') + '</svg>';
  }
  function isSatirHtml(i){
    const acikMi = ACIK_IS.indexOf(i.durum) >= 0;
    return '<li class="king__is is-' + kac(i.durum) + '"><div class="king__is-ust"><b>' + kac(i.baslik) + '</b>'
      + (acikMi ? '<button type="button" class="king__cip king__cip--tehlike" data-king="is-iptal:' + Number(i.id) + '">İptal</button>' : '') + '</div>'
      + '<small>' + kac(isAjanAd(i)) + ' · ' + kac(i.durum_ad || i.durum) + (acikMi && i.adim ? ' · ' + kac(i.adim) : '') + '</small>'
      + (i.durum === 'calisiyor' ? cubukHtml(i.ilerleme, i.baslik + ': yüzde ' + (Number(i.ilerleme) || 0)) : '') + '</li>';
  }
  function gorevHtml(g){
    const adim = no => (g.adimlar || [])[no - 1];
    const il = g.ilerleme || {};
    const gunler = Array.isArray(g.gunler) ? g.gunler : [];
    /* Açık gün: bitmemiş adımı olan ilk gün; yalnız onun adımları adıyla yazılır. */
    const simdi = gunler.find(d => (d.adimlar || []).some(n => { const a = adim(n); return a && ['bitti', 'iptal'].indexOf(a.durum) < 0; }));
    const nokta = a => '<i class="king__adim-nokta is-' + kac(a.durum) + '" title="' + kac(a.baslik + ' · ' + a.ajan_ad + ' · ' + a.durum_ad) + '"></i>';
    const gunHtml = d => {
      const l = (d.adimlar || []).map(adim).filter(Boolean);
      return '<li class="king__gun' + (d === simdi ? ' is-simdi' : '') + '"><span class="king__gun-ad">' + kac(d.gun_ad) + '</span>'
        + '<span class="king__gun-noktalar" role="img" aria-label="' + kac(d.gun_ad) + ': ' + l.filter(a => a.durum === 'bitti').length + '/' + l.length + ' adım bitti">' + l.map(nokta).join('') + '</span>'
        + (d === simdi && g.durum !== 'iptal' ? '<ul class="king__adimlar">' + l.map(a => '<li class="is-' + kac(a.durum) + '">' + nokta(a)
          + '<span>' + kac(a.baslik) + '</span><small>' + kac(a.ajan_ad) + ' · ' + kac(a.durum_ad)
          + (a.durum === 'calisiyor' && a.ilerleme ? ' · %' + Number(a.ilerleme) : '') + '</small></li>').join('') + '</ul>' : '') + '</li>';
    };
    const id = Number(g.id);
    return '<section class="king__gorev is-' + kac(g.durum) + '" aria-label="Görev: ' + kac(g.hedef) + '">'
      + '<div class="king__gorev-bas"><b>' + kac(g.hedef) + '</b><span>' + kac(g.modul_ad) + ' · ' + kac(g.ajan_ad) + ' · ' + kac(g.durum_ad) + '</span></div>'
      + cubukHtml(il.yuzde, (il.bitti || 0) + '/' + (il.toplam || 0) + ' adım bitti')
      + '<small class="king__gorev-alt">' + (il.bitti || 0) + '/' + (il.toplam || 0) + ' adım · ' + (Number(g.gun_sayisi) || gunler.length) + ' gün'
      + (g.gunluk_dk ? ' · günde ' + Number(g.gunluk_dk) + ' dk' : '') + '</small>'
      + (gunler.length ? '<ol class="king__gunler">' + gunler.map(gunHtml).join('') + '</ol>' : '')
      + (g.teklif_sayisi > 0 ? '<p class="king__menu-not">' + Number(g.teklif_sayisi) + ' plan teklifi ' + kac(g.modul_ad) + '’nin Onaylar ekranında onayını bekliyor; sen onaylamadan bir şey yazılmaz.</p>' : '')
      + (g.durum === 'taslak' ? '<div class="king__cipler"><button type="button" class="king__cip king__cip--ana" data-king="gorev-onayla:' + id + '">Başlat</button>'
          + '<button type="button" class="king__cip" data-king="gorev-iptal:' + id + '">' + (gorevIptalOnay === id ? 'Emin misin? Vazgeç' : 'Vazgeç') + '</button></div>'
        : g.durum === 'suruyor' ? '<div class="king__cipler"><button type="button" class="king__cip king__cip--tehlike" data-king="gorev-iptal:' + id + '">'
          + (gorevIptalOnay === id ? 'Emin misin? İptal et' : 'İptal') + '</button></div>' : '')
      + '</section>';
  }
  function ekipHtml(){
    const sira = { suruyor:0, taslak:1, bitti:2, iptal:3 };
    const gorevler = ekip.gorevler.slice().sort((a, b) => (sira[a.durum] - sira[b.durum]) || (b.id - a.id))
      .filter((g, i) => g.durum === 'suruyor' || g.durum === 'taslak' || i < 3);
    const isler = ekip.isler.filter(i => i.tur !== 'gorev_adim' || ACIK_IS.indexOf(i.durum) >= 0).slice(0, 8);
    return '<div class="king__menu king__ekip" role="group" aria-label="Ekip ve görevler">'
      + (!baglanti() ? '<p class="king__menu-bos">Ekip Merkez’de (HKM) çalışır; Merkez bağlı değil.</p>'
        : !ekip.yuklu ? '<p class="king__menu-not" role="status">Yükleniyor…</p>'
        : '<h3 class="king__menu-bolum">Görevler</h3>'
          + (gorevler.length ? gorevler.map(gorevHtml).join('') : '<p class="king__menu-bos">Görev yok. «Bu hafta B1’e hazırla beni» gibi yazarsan King adım adım bir görev kurar; sen başlatmadan başlamaz.</p>')
          + '<h3 class="king__menu-bolum">İşler</h3>'
          + (isler.length ? '<ul class="king__isler">' + isler.map(isSatirHtml).join('') + '</ul>'
            : '<p class="king__menu-bos">Arka planda iş yok. «Arka planda … araştır» dersen ekibe veririm; sen konuşmaya devam edersin.</p>'))
      + '</div>';
  }

  /* ------------------------------------------------------- King 3.0 K2: beceriler, sözler, bekleyen */
  /* Veri HKM'den (belgeler/ekip/KING-BECERI.md). Tetiği, vadeyi ve eylemi HKM'nin
     kodu çıkarır; burada listelenir, açılıp kapanır, düzeltilir, silinir. Yazan
     eylem (kayıt, yazan araç) yine modülün onay kartından geçer. */
  const ODAK_SON = 'lifeos.king.odak-son';   // son biten odak sayacı { dk, konu, at }: «süreyi yaz» eylemi için
  const GUN_AD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  let beceriV = { beceriler:[], sozler:[], yuklu:false, not:'' };
  let beceriDuzelt = null, beceriSilOnay = null, bekleyenSon = 0, bekleyenArac = null;
  let k2Soru = 0;                     // King'in bekleyen sorusu ne zaman soruldu (0: yok)
  async function beceriTazele(){
    const [b, s] = await Promise.all([kingIstek('/api/king/beceriler'), kingIstek('/api/king/sozler')]);
    if(b && b.status === 200 && b.g && Array.isArray(b.g.beceriler)) beceriV.beceriler = b.g.beceriler;
    if(s && s.status === 200 && s.g && Array.isArray(s.g.sozler)) beceriV.sozler = s.g.sozler;
    beceriV.yuklu = true;
    if(acik && (menu === 'beceri' || bolum === 'rutin')) ciz(false);
  }
  async function beceriAc(){
    beceriDuzelt = null; beceriSilOnay = null; beceriV.not = '';
    alanAc('beceri');
    await beceriTazele();
  }
  async function beceriEylem(yol, govde){
    const k = baglanti();
    if(!k) return null;
    try{
      const res = await ortam.fetch(k.url + yol, { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token }, body:JSON.stringify(govde || {}) });
      let g = null;
      try{ g = await res.json(); }catch(e){ g = null; }
      return { status:res.status, g };
    }catch(e){ return null; }
  }
  async function beceriYap(id, eylem){
    beceriSilOnay = null; beceriV.not = '';
    const r = await beceriEylem('/api/king/beceriler/' + id + '/' + eylem);
    if(!r || r.status !== 200) beceriV.not = 'Merkez cevap vermedi; değişmedi.';
    await beceriTazele();
  }
  async function sozSil(id, n){
    const r = await beceriEylem('/api/king/sozler/' + id + '/sil');
    const m = n != null ? akis[n] : null;
    if(m && m.k2){ m.k2.bitti = r && r.status === 200 ? 'Söz silindi; sormayacağım.' : 'Söz silinemedi; Merkez cevap vermedi.'; sakla(); }
    if(menu === 'beceri' || bolum === 'rutin') await beceriTazele(); else ciz(false);
  }
  async function cevapGeri(id, n){
    const r = await beceriEylem('/api/king/bekleyen/' + id + '/geri');
    const m = akis[n];
    if(m && m.k2) m.k2.bitti = r && r.status === 200 ? 'Tamam, cevap sayılmadı; soru açık.' : 'Geri alınamadı; Merkez cevap vermedi.';
    ciz(false);
  }
  /* Düzelt: ad, (zaman tetiğinde) saat ve mesaj/soru cümleleri. Doğrulamayı HKM yapar. */
  async function beceriKaydet(id, f){
    const b = beceriV.beceriler.find(x => x.id === id);
    if(!b) return;
    const deger = ad => { const el = f.querySelector('[name="' + ad + '"]'); return el ? String(el.value || '').trim() : ''; };
    const govde = {};
    if(deger('ad') && deger('ad') !== b.ad) govde.ad = deger('ad');
    if(b.tetik && b.tetik.tur === 'zaman' && /^\d{2}:\d{2}$/.test(deger('saat')) && deger('saat') !== b.tetik.saat) govde.tetik = Object.assign({}, b.tetik, { saat:deger('saat') });
    const el = (b.eylemler || []).map((e, i) => (e.tur === 'mesaj' || e.tur === 'soru') && deger('e' + i) ? Object.assign({}, e, { metin:deger('e' + i) }) : e);
    if(JSON.stringify(el) !== JSON.stringify(b.eylemler)) govde.eylemler = el;
    if(!Object.keys(govde).length){ beceriDuzelt = null; ciz(false); return; }
    const r = await beceriEylem('/api/king/beceriler/' + id, govde);
    if(r && r.status === 200){ beceriDuzelt = null; beceriV.not = ''; }
    else beceriV.not = (r && r.g && (r.g.note || r.g.error)) || 'Merkez cevap vermedi; değişmedi.';
    await beceriTazele();
  }
  function tetikMetni(t){
    if(!t) return '';
    if(t.tur === 'soz') return '«' + t.kalip + '» deyince';
    const g = Array.isArray(t.gunler) ? t.gunler : [];
    return (g.length === 0 || g.length === 7 ? 'Her gün' : g.map(i => GUN_AD[i] || '').join(', ')) + ' · ' + (t.saat || '');
  }
  function beceriHtml(b){
    const id = Number(b.id), duzelt = beceriDuzelt === id;
    const ust = '<div class="king__is-ust"><b>' + kac(b.ad) + '</b>'
      + '<button type="button" class="king__secim" role="switch" aria-checked="' + (b.acik ? 'true' : 'false') + '" data-king="beceri-' + (b.acik ? 'kapat' : 'ac') + ':' + id
      + '" aria-label="' + kac(b.ad) + (b.acik ? ' açık' : ' kapalı') + '"><span class="king__anahtar' + (b.acik ? ' is-acik' : '') + '" aria-hidden="true"><i></i></span></button></div>';
    if(duzelt) return '<li class="king__is king__beceri"><form class="king__beceri-form" data-king-beceri-form="' + id + '">'
      + '<input type="text" name="ad" aria-label="Becerinin adı" value="' + kac(b.ad) + '" autocomplete="off" data-ayar-disi/>'
      + (b.tetik && b.tetik.tur === 'zaman' ? '<label>Saat <input type="time" name="saat" value="' + kac(b.tetik.saat || '') + '" data-ayar-disi/></label>' : '')
      + (b.eylemler || []).map((e, i) => e.tur === 'mesaj' || e.tur === 'soru'
        ? '<input type="text" name="e' + i + '" aria-label="' + (e.tur === 'soru' ? 'Soru' : 'Mesaj') + '" value="' + kac(e.metin) + '" autocomplete="off" data-ayar-disi/>' : '').join('')
      + '<div class="king__cipler"><button type="submit" class="king__cip king__cip--ana">Kaydet</button>'
      + '<button type="button" class="king__cip" data-king="beceri-duzelt:0">Vazgeç</button></div></form></li>';
    return '<li class="king__is king__beceri' + (b.acik ? '' : ' is-kapali') + '">' + ust
      + '<small>' + kac(tetikMetni(b.tetik)) + (b.calisma ? ' · ' + Number(b.calisma) + ' kez çalıştı' : '') + '</small>'
      + '<p class="king__beceri-ozet">' + kac(b.ozet || '') + '</p>'
      + '<div class="king__cipler"><button type="button" class="king__cip" data-king="beceri-duzelt:' + id + '">Düzelt</button>'
      + '<button type="button" class="king__cip king__cip--tehlike" data-king="beceri-sil:' + id + '">' + (beceriSilOnay === id ? 'Emin misin? Sil' : 'Sil') + '</button></div></li>';
  }
  function sozHtml(s){
    const acikMi = s.durum === 'bekliyor' || s.durum === 'soruldu';
    return '<li class="king__is' + (acikMi ? '' : ' is-kapali') + '"><div class="king__is-ust"><b>' + kac(s.metin) + '</b>'
      + (acikMi ? '<button type="button" class="king__cip king__cip--tehlike" data-king="soz-sil:' + Number(s.id) + '">Sil</button>' : '') + '</div>'
      + '<small>' + kac(s.durum_ad || s.durum) + (s.vade_metin && acikMi ? ' · ' + kac(s.vade_metin) : '') + '</small>'
      + (s.soru ? '<p class="king__beceri-ozet">' + kac(s.soru) + (s.cevap ? ' → ' + kac(typeof s.cevap === 'string' ? s.cevap : (s.cevap.metin || '')) : '') + '</p>' : '') + '</li>';
  }
  function beceriPanelHtml(){
    const sozler = beceriV.sozler.filter(s => s.durum === 'bekliyor' || s.durum === 'soruldu')
      .concat(beceriV.sozler.filter(s => s.durum === 'kapandi').slice(0, 3));
    return '<div class="king__menu king__ekip" role="group" aria-label="Beceriler ve sözler">'
      + (!baglanti() ? '<p class="king__menu-bos">Beceriler ve sözler Merkez’de (HKM) durur; Merkez bağlı değil.</p>'
        : !beceriV.yuklu ? '<p class="king__menu-not" role="status">Yükleniyor…</p>'
        : (beceriV.not ? '<p class="king__menu-not" role="status">' + kac(beceriV.not) + '</p>' : '')
          + '<h3 class="king__menu-bolum">Beceriler</h3>'
          + (beceriV.beceriler.length ? '<ul class="king__isler">' + beceriV.beceriler.map(beceriHtml).join('') + '</ul>'
            : '<p class="king__menu-bos">Henüz beceri yok. «Her pazartesi bana deneme hatırlat» ya da «‘ders bitti’ deyince 5 dakikalık mola aç» diye öğretebilirsin.</p>')
          + '<h3 class="king__menu-bolum">Sözler</h3>'
          + (sozler.length ? '<ul class="king__isler">' + sozler.map(sozHtml).join('') + '</ul>'
            : '<p class="king__menu-bos">Açık söz yok. «Yarın fizik sınavım var» dersen zamanı gelince nasıl geçtiğini sorarım.</p>'))
      + '</div>';
  }
  /* King'in balonundaki K2 satırı: «söz aldım» / «cevap olarak not aldım» ve geri düğmesi. */
  function k2Html(m, n){
    const x = m.k2;
    if(!x) return '';
    if(x.bitti) return '<p class="king__k2" role="status">' + kac(x.bitti) + '</p>';
    return '<p class="king__k2">' + kac(x.not || '') + '</p>'
      + (x.soz_id != null || x.bekleyen_id != null ? '<div class="king__cipler">'
        + (x.soz_id != null ? '<button type="button" class="king__cip" data-king="k2-soz:' + Number(x.soz_id) + ':' + n + '">Söz yapma</button>' : '')
        + (x.bekleyen_id != null ? '<button type="button" class="king__cip" data-king="k2-cevap:' + Number(x.bekleyen_id) + ':' + n + '">Cevap değil</button>' : '')
        + '</div>' : '');
  }
  /* HKM cevabındaki K2 alanları (merkezeSor). Not metinden ayrılır, ayrı satırda durur. */
  function k2Oku(g){
    if(!g || !(g.k2_not || g.soz || g.cevap)) return null;
    return { not:String(g.k2_not || ''), soz_id:g.soz && g.soz.id != null ? g.soz.id : null,
      bekleyen_id:g.cevap && g.cevap.bekleyen_id != null ? g.cevap.bekleyen_id : null, kutuya:(g.cevap && g.cevap.kutuya) || null };
  }
  /* Beceri eylemleri (mesaj ve soru zaten metinde): sayaç açılır; kayıt ve yazan araç onay kartıyla. */
  async function eylemleriCalistir(l){
    for(const e of (Array.isArray(l) ? l : []).slice(0, 6)){
      if(!e || typeof e !== 'object') continue;
      if(e.tur === 'sayac'){ const dk = Math.round(Number(e.dakika)); if(dk >= 1 && dk <= 180) odakBaslat(dk, String(e.ad || 'Sayaç')); }
      else if(e.tur === 'kayit') await eylemKayit(e);
      else if(e.tur === 'arac' && e.ad){
        const A = ARAC(), d = A ? A.dogrula(e.ad, e.param || {}) : null;
        if(d && d.ok && d.arac.tur !== 'yaz' && e.yaz){
          bekleyenArac = { ad:d.arac.ad, param:d.param };
          soyle('Beceri «' + d.arac.ad + '» aracını çalıştırmak istiyor. Yapayım mı?');
          cipler = [{ ad:'Yap', is:'beceri-arac' }, { ad:'Gerek yok', is:'vazgec' }];
          ciz(false);
        }else await aracIsle({ arac:[{ ad:e.ad, param:e.param || {} }] }, '');
      }
    }
  }
  async function eylemKayit(e){
    let metin = String(e.metin || '').trim();
    if(!metin || !ayar) return;
    if(e.alan === 'sure'){
      const s = ortam.depo.oku(ODAK_SON);
      if(s && s.dk && ortam.simdi().getTime() - Number(s.at || 0) < 6 * 3600 * 1000) metin = s.dk + ' dk ' + metin;
      else { soyle('«' + metin + '» için süreyi bilmiyorum (biten bir odak sayacı yok). Kaç dakika sürdü? «45 dk ' + metin + '» gibi yaz.'); return; }
    }
    const m = e.modul && MODUL_AD[e.modul] ? e.modul : ayar.modul;
    if(m !== ayar.modul){
      const ok = await kutuyaBirak(m, metin);
      soyle(ok ? '«' + metin + '» ' + MODUL_AD[m] + ' açılınca onayına sunulacak.' : '«' + metin + '» ' + MODUL_AD[m] + '’ye iletilemedi; orada yazabilirsin.');
      return;
    }
    const veri = veriKapisi();
    let p = null;
    if(veri) try{ p = veri.onizle(metin); }catch(er){ p = null; }
    if(!p || !p.metin){ soyle('Beceri «' + metin + '» kaydını istedi ama anlayamadım; kendin yazabilirsin.'); return; }
    bulunanGoster([yeniOge({ modul:ayar.modul, metin:String(p.metin), kaynak:metin }, p)], 'Beceri bir kayıt istiyor; onaylarsan yazılır:');
  }
  /* Bekleyen mesajlar: saati gelen beceri ve vadesi gelen söz. Alınan bir daha gelmez. */
  async function bekleyenAl(){
    bekleyenSon = ortam.simdi().getTime();
    if(!ayar) return 0;
    const r = await kingIstek('/api/king/bekleyen?modul=' + ayar.modul);
    const l = r && r.status === 200 && r.g && Array.isArray(r.g.mesajlar) ? r.g.mesajlar.filter(x => x && x.metin) : [];
    if(!l.length || !acik) return 0;
    for(const x of l){
      akis.forEach(m => { m.yeni = false; });
      akis.push({ kim:'king', metin:String(x.metin), yeni:true });
      akis = akis.slice(-GUNLUK_EN_COK);
      sakla();
      ciz(false);
      if(ortam.gizli()) ortam.bildir('King', String(x.metin));
      if(x.soru) k2Soru = ortam.simdi().getTime();
      await eylemleriCalistir((x.eylemler || []).filter(e => e && e.tur !== 'mesaj' && e.tur !== 'soru'));
    }
    return l.length;
  }

  /* ------------------------------------------------------- K3: «King» deyince uyanma */
  /* Varsayılan kapalı; ··· menüsünde açılır. Mikrofonu kod dinler (yalnız ses
     seviyesi, model yok); kısa bir konuşma bitince o parça YALNIZ bu
     bilgisayardaki Merkez'e gider ve yerel modelle (Gemma 4, sonra Whisper;
     Gemini asla) yazıya dökülür. Başında «King» yoksa unutulur. Boşa giden
     her parçadan sonra bekleme uzar (televizyon, gürültü GPU'yu yormasın). */
  const UYAN = 'lifeos.king.uyan';
  const UYAN_RE = /^(?:hey|hi|ey|selam|merhaba)?\s*(?:king|kink|kıng|kin|kingg)(?![a-zçğıöşü])\s*(.*)$/;
  let uyanik = null, uyanAciliyor = false, uyanMesgul = false, uyanBekle = 0, uyanKacan = 0, uyanHata = 0, uyanAralik = null;
  let uyanTur = false;               // uyanmayla başlayan sesli konuşma sürüyor
  let uyanNot = '';
  function uyanAcikMi(){ return ortam.depo.oku(UYAN) === true; }
  const uyanYerel = k => /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(k.url);
  /* Saf: yazıya dökülmüş parça «King …» mi? Döner: kalan cümle ('' yalnız King) ya da null. */
  function uyanCumlesi(metin){
    if(typeof metin !== 'string') return null;
    const t = kucuk(metin).replace(/[.,!?;:"'’…«»]+/g, ' ').replace(/\s+/g, ' ').trim();
    const m = t.match(UYAN_RE);
    if(!m) return null;
    return String(metin).replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü]*(?:(?:hey|hi|ey|selam|merhaba)[\s,]+)?\S+[\s,.!?]*/i, '').trim();
  }
  function uyanGerek(){
    if(!ayar || !ortam.uyanikAc || !uyanAcikMi()) return false;
    const k = baglanti();
    if(!k || !uyanYerel(k) || ortam.gizli()) return false;
    if(sesliSohbet || dinleyen || konusuyor > 0 || kesici || mikDeniyor) return false;
    return ortam.simdi().getTime() >= uyanHata;
  }
  async function uyanKontrol(){
    if(!uyanGerek()){
      if(uyanik){ const u = uyanik; uyanik = null; try{ u.bitir(); }catch(e){ /* kapalı */ } }
      return;
    }
    if(uyanik || uyanAciliyor) return;
    uyanAciliyor = true;
    try{
      const u = await ortam.uyanikAc(uyanParca, mikSecili());
      if(uyanGerek() && !uyanik){ uyanik = u; uyanNot = ''; } else u.bitir();
    }catch(e){
      uyanHata = ortam.simdi().getTime() + 60000;        // izin yoksa her saniye sorulmaz
      uyanNot = 'Mikrofon açılamadı; «King» ile uyanma şimdilik çalışmıyor.';
    }
    uyanAciliyor = false;
  }
  async function uyanParca(pcm, hz){
    if(uyanMesgul || ortam.simdi().getTime() < uyanBekle || !uyanGerek()) return;
    const k = baglanti();
    uyanMesgul = true;
    let metin = null;
    try{
      const res = await ortam.fetch(k.url + '/api/dinle', { method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + k.token },
        body:JSON.stringify({ wav:wavYap(pcm, hz), tercih:algila() === 'whisper' ? 'whisper' : 'gemma' }) });
      const g = res.status === 200 ? await res.json() : null;
      metin = g && typeof g.metin === 'string' ? g.metin : null;
    }catch(e){ metin = null; }
    uyanMesgul = false;
    const kalan = uyanCumlesi(metin);
    if(kalan === null){
      uyanKacan = Math.min(uyanKacan + 1, 15);
      uyanBekle = ortam.simdi().getTime() + uyanKacan * 2000;
      return;
    }
    uyanKacan = 0; uyanBekle = 0;
    if(!uyanAcikMi() || sesliSohbet || dinleyen) return;
    uyandi(kalan);
  }
  /* Uyanınca: King küçük kutuyla açılır ve sesli konuşma başlar; «tamam» ya da
     iki sessizlik bitirir, sonra King yine «King»i bekler. */
  function uyandi(kalan){
    if(!acik) ac({ mini:true });
    if(!acik) return;
    uyanTur = true; sesliSohbet = true; sessizSay = 0; sesli = true;
    uyanKontrol();
    if(kalan) isle(kalan);
    else soyle('Buyur.');
  }
  function uyanTik(){
    if(!sesliSohbet) uyanTur = false;
    uyanKontrol();
  }
  function uyanKur(){
    const ac_ = uyanAcikMi() && !!ortam.uyanikAc && typeof setInterval === 'function' && typeof document !== 'undefined';
    if(ac_ && !uyanAralik){
      uyanAralik = setInterval(uyanTik, 2000);
      try{ document.addEventListener('visibilitychange', uyanKontrol); }catch(e){ /* yok */ }
    }
    if(!ac_ && uyanAralik){
      clearInterval(uyanAralik); uyanAralik = null;
      try{ document.removeEventListener('visibilitychange', uyanKontrol); }catch(e){ /* yok */ }
    }
    uyanKontrol();
  }
  function uyanSec(ac_){
    if(ac_) ortam.depo.yaz(UYAN, true); else ortam.depo.sil(UYAN);
    uyanHata = 0; uyanNot = '';
    uyanKur();
    ciz(false);
  }
  function uyanHtml(){
    if(!ortam.uyanikAc) return '';
    const a = uyanAcikMi(), k = baglanti();
    const not = !a ? 'Kapalı. Açınca mikrofon dinlemede kalır; «King» dediğin kısa cümle yalnız bu bilgisayardaki Merkez’de yazıya dökülür, başka yere gitmez.'
      : !k || !uyanYerel(k) ? 'Yalnız bu bilgisayarda, Merkez açıkken çalışır.'
      : uyanNot || (uyanik ? 'Dinliyor. «King» de ya da «King, bugün ne var?» diye sor.' : 'King konuşurken ya da dinlerken bekler.');
    return '<div class="king__menu-satir king__menu-anahtar"><span class="king__menu-ad">«King» deyince uyan</span>'
      + '<button type="button" class="king__secim" role="switch" aria-checked="' + (a ? 'true' : 'false') + '" data-king="uyan:' + (a ? '0' : '1') + '" aria-label="«King» deyince uyan">'
      + '<span class="king__anahtar' + (a ? ' is-acik' : '') + '" aria-hidden="true"><i></i></span></button></div>'
      + '<p class="king__menu-not" data-king-uyan-not>' + kac(not) + '</p>';
  }

  function kur(o){
    ayar = Object.assign({ modul:'spi' }, o || {});
    uyanKur();
    /* Söz 36: King'in kendi araçları kataloğa (her çağrıda güncel kurulur). */
    if(L.ARAC){ L.ARAC.modulSec(ayar.modul); L.ARAC.ortakKur(ortakAraclar); }
    if(typeof window !== 'undefined') setTimeout(() => { try{ if(odak()) odakKur(); hatirlatKur(); }catch(e){ /* yok */ } }, 0);
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
    else if(tasindi && ts.git && typeof ts.git.route === 'string') hedef = { route:ts.git.route, sekme:ts.git.sekme || null, is:ts.git.is };
    if(hedef && gecerliRota(ayar.modul, hedef.route)){
      ortam.zamanla(() => {
        try{ ayar.git(hedef.route, hedef.sekme ? { sekme:hedef.sekme } : {}); }catch(e){ console.error('King:', e); }
        /* Söz 9: King'le gelindi; burada küçük kutu olarak açık kalır. */
        const s = SAYFALAR.find(x => x.modul === ayar.modul && x.route === hedef.route);
        /* Söz 37: «Tüm işler»den seçilen iş burada açılır. */
        const isVar = Number.isInteger(hedef.is) && ARAC() && ARAC().ISLER[hedef.is] && ARAC().ISLER[hedef.is].modul === ayar.modul;
        ac({ mini:!isVar, onceki, mesaj:isVar ? MODUL_AD[ayar.modul] + '’ye geçtik.' : 'Buradayım. ' + (s ? s.ad + ' açık; ' : '') + 'yaptığını yaz, kaydedeyim.' });
        if(isVar) isSec(hedef.is);
      }, 60);
      return;
    }
    if(tasindi) ortam.zamanla(() => ac({ mini:true, onceki,
      mesaj:ts.yenile && ts.kaynak === ayar.modul ? 'Tamam, sayfa yenilendi; buradayım.' : MODUL_AD[ayar.modul] + '’ye geçtik, buradayım.' }), 60);
  }

  function _sifirla(){
    paylasimKapat();
    if(typeof document !== 'undefined'){
      const el = document.querySelector('[data-king]');
      if(el) el.remove();
      document.documentElement.classList.remove('king-acik');
      document.documentElement.classList.remove('king-mini');
    }
    if(ayar) ortam.depo.sil(depoAnahtar());
    ortam.depo.sil(TASIMA);
    ortam.depo.sil(SIRA); ortam.depo.sil(SOZET); ortam.depo.sil(DERSLER); kaynakMetin = null;
    ortam.depo.sil(YAP); ortam.depo.sil(HATIR); ortam.depo.sil(KART); ortam.depo.sil(GORSEL); kutFiltre = 'hepsi'; kutBuyuk = null; kartOnbellek = null; kvDuzen = false; kvSecili = null; kvYeni = false; kvGiris = true; if(hatirSaat){ try{ clearTimeout(hatirSaat); }catch(e){ /* yok */ } hatirSaat = null; }
    siradanSoru = null; siraCalisiyor = false;
    if(siraSaat){ try{ clearInterval(siraSaat); }catch(e){ /* yok */ } siraSaat = null; }
    if(ayar) ortam.depo.sil(arsivAnahtar());
    ortam.depo.sil(CEVAP); ortam.depo.sil(ALGILA); ortam.depo.sil(MIK); ortam.depo.sil(KAM); kamListe = [];
    menu = null; silOnay = null; silinen = null; bekleyenYetki = null; bekleyenTanisma = null; disKisi = [];
    yanAcik = false; aktifKayit = null; aracAcik = false; kipAcik = false; bolum = 'sohbet'; klasorYeni = false; tasinan = null; adlandirilan = null;
    if(ayar) ortam.depo.sil(klasorAnahtar());
    ortam.depo.sil(CIKARIM_KARAR); ortam.depo.sil(SORMA);
    envanter = null; ortam.depo.sil(USLUP);
    ortam.depo.sil(TANISMA);
    ayar = null; acik = false; mini = false; akis = []; bekleyenFoto = null; fotoHedef = null; aracSayfa = null; doldurulacak = ''; sonGeriAl = null; sesliSohbet = false; sessizSay = 0; cipler = null; bekleyen = null; bekleyenGit = null; bekleyenIlet = null;
    if(mikDeniyor){ try{ mikDeniyor.iptal(); }catch(e){ /* durmus */ } mikDeniyor = null; }
    mikListe = []; mikNot = ''; hkmDinlemezBitis = 0; dinleHata = 0; dinleNot = ''; kesiciKapat(); odakTemizle(); ritim = null; gunlukBekle = false; gunlukMetin = ''; deneyTaslak = null;
    if(dinleyen){ try{ dinleyen.onend = dinleyen.onerror = null; dinleyen.abort(); }catch(e){ /* durmus */ } }
    sesli = false; dinleyen = null; konusuyor = 0; sesNo++; calan = null; sonMotor = ''; sonNot = '';
    sesKuyruk = null; sesAkisYok = false;
    if(isZaman){ clearTimeout(isZaman); isZaman = null; }
    isDurum = null; izlenen = {}; ekip = { isler:[], gorevler:[], yuklu:false }; gorevIptalOnay = null;
    beceriV = { beceriler:[], sozler:[], yuklu:false, not:'' }; beceriDuzelt = null; beceriSilOnay = null; bekleyenSon = 0; bekleyenArac = null; k2Soru = 0;
    ortam.depo.sil(ODAK_SON);
    ortam.depo.sil(UYAN); uyanTur = false; uyanNot = ''; uyanHata = 0; uyanBekle = 0; uyanKacan = 0; uyanMesgul = false;
    if(uyanAralik){ clearInterval(uyanAralik); uyanAralik = null; }
    if(uyanik){ try{ uyanik.bitir(); }catch(e){ /* kapalı */ } uyanik = null; }
  }

  return {
    kur, ac, kapat, kucult, buyut, ekranDegisti, yorumla, isle, hazirSec, kaydet, dinle, sesSec, veriGibi,
    isDurumYaz:d => { isDurum = d; }, arkadasHal, ARKADAS_UYKU, isRozet, isYokla, ekipAc, ekipHtml, gorevHtml, isZamanli:() => !!isZaman,
    beceriAc, beceriPanelHtml, bekleyenAl, eylemleriCalistir, k2Html, ODAK_SON,
    uyanCumlesi, uyanSec, uyanAcikMi, uyanParca, uyanKontrol, uyanikMi:() => !!uyanik, uyanTurMu:() => uyanTur, UYAN,
    fotoAl, fotoIsle, ekranOku, ekranGoster, sesliSohbetAc, geriAlYap, sesliSohbetMi:() => sesliSohbet,
    paylasimBaslat, paylasimBitir, paylasimVar:() => !!paylasim, kameraAc, kamSec, kamTazele, KAM, fotoYorumla, GORSEL_SISTEM, TASIMA,
    kisiKayitlari, kisiOzeti, disKisiTazele, tanismaVar:() => !!bekleyenTanisma,
    cikarimAdaylari, cikarimKarti, cikarimOnayla, SORMA, sormaKomutu, sormaMi, sormaListesi,
    USLUP, envanterVar:() => !!envanter,
    yetkiUygula, bekleyenYetki:() => bekleyenYetki,
    CEVAP, cevapBicimi, cevapSec, SES, sesTercihi, sesTercihSec, sesParcalari, seslendir, sus, wavYap, sonMotor:() => sonMotor, sonNot:() => sonNot, YAN, yanDar, yanDarSec, DERIN, derinlik, derinlikSec, kartNiyeti, soruCevapla, bicimli, tarz, tarzSec, TARZ, odak, ODAK, sohbetBas, BAS, ayarKomutu, oneriListesi, cizgi, haftaHedefi, HEDEF, DENEY, deneyOku, notPuanla, parcalaGunluk, sohbettenBul, bulunanKaydet, BEKLEYEN_KAYIT,
    MIK, mikSecili, mikSec, mikTazele, mikDene, algila,
    sohbetiKaydet, sohbetiTemizle, sohbetiGeriGetir, kayitlar:arsivOku, kayitIndir,
    kayitKopyala, kayitSil, kayitMetni, menuAc, menuDurum:() => menu,
    yeniSohbet, kayitAc, ARACLAR, aktifKayit:() => aktifKayit,
    BOLUMLER, bolumSec, bolum:() => bolum, listeGorunur, alanAc, pdfAl, nedenSatirlari, yetenekler, dersNiyeti, hesapla, birimCevir, kartEkle, kartSabitle, oneCikanlar, yapilacaklar, hatirlatmalar, yasaHesapla, kdKur, kdDersler, DERSLER, sira, siraBosalt, SIRA, SOZET, sozetler,
    KIPLER, kip, kipSec, klasorler, klasorEkle, klasorSil, kayitTasi, kayitAdlandir, kayitSabitle,
    acikMi:() => acik, miniMi:() => mini, akis:() => akis.slice(),
    SAYFALAR, HAZIR, _ortam:ortam, _sifirla, _videoKaynak:videoKaynak, _gorunurluk:gorunurluk,
    aracIsle, ortakAraclar, haritaCevap, HARITA_RE,
    isSec, kameraIs, fotoHedef:() => fotoHedef, arastirmaVeri, arastirmaEkle, cipler:() => (cipler || []).slice(),
  };
})();
