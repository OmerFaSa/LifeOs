/* Aciklama metinleri tek yerde.

   Amac: ekranlarda uzun paragraflar birakmamak. Ana alan veri ve aksiyon gosterir;
   "bu ne ise yarar" bilgisi kenar kartlarina ve ⓘ ipuclarina taşinir.
   t = baslik (2-4 kelime), b = kisa aciklama (bir cumle), more = detay (opsiyonel). */

window.R = window.R || {};

R.HINTS = {
  /* --- sistemin kendi denetimi --- */
  'friction':{ t:'Sürtünme', b:'Sistemi yönetmeye giden süre ile gerçekleşen çalışma süresinin payı.',
    more:'Ölçen bir sistem bir süre sonra ölçmeyi işin kendisi sanmaya başlar: aday ders çalışmak yerine kendi çalışma sistemini yönetir. Tek dürüst cevap sürtünmeyi de ÖLÇMEKTİR. Süreli deneme açıkken geçen süre sınavdır, yönetim değil. Bütçe (15 dk/gün) VE oran (%25) birlikte aşılmadıkça sistem susar — hafta planı kurulan gün doğal olarak yönetim ağırlıklıdır. Sistem yalnızca kendi yükünü AZALTMAYI önerebilir.' },
  'goodhart':{ t:'Gösterge ayrışması', b:'Çaba arttı da sonuç yerinde mi saydı?',
    more:'Goodhart yasası: bir ölçü hedef hâline geldiğinde iyi bir ölçü olmaktan çıkar. Soru sayısı hedefe dönüştüğünde kolay sorular seçilir, yanlışlar incelenmez, süre tutulmaz — sayı yükselir, net yükselmez. Nöbetçi iki bitişik 28 günlük pencerede çabayı ve sonucu karşılaştırır; hüküm vermez, soru sorar. Çaba düşerken uyarı üretmez: işi tembelliği değil verimsiz gayreti görmektir.' },
  'calib':{ t:'Kalibrasyon', b:'Sistem söylemeden önce senin tahminin; sonra ikisinin farkı.',
    more:'Kendi netini kestirebilmek bir süs değil sınav becerisidir: hangi testte zaman harcayacağını, hangi soruyu bırakacağını ve bir denemenin kötü mü yoksa zor mu olduğunu o kestirim söyler. Tahmin KÖR yazılır — net ekranda dururken yazılan tahmin, tahmin değil kopyadır. Beşin altında kapanmış tahminle puan verilmez; puan kişiye değil tahmine aittir.' },
  'signal':{ t:'Denetim sorusu', b:'Nöbetçinin ya da sürtünme ölçerin sorduğu tek soru.',
    more:'Denetim mekanizması ile denetim EKRANI aynı şey değildir: arka planda çalışan nöbetçinin bir ekran ağacı olması gerekmez, doğru anda mevcut akışa düşen tek bir soru yeter. Aynı anda en fazla bir soru açık kalır; cevaplamak zorunlu değildir ve «bu soru bana uymuyor» da bir cevaptır. Soru cevaplanınca kapanmaz — ayrışmanın gerçekten kapanıp kapanmadığı bir sonraki pencerede ölçülür.' },

  /* --- gunluk --- */
  'anchor':{ t:'Günlük çıpalar', b:'Paragraf ve problem her gün sabit kalır; konu değişse de bu iki rutin düşmez.',
    more:'Paragraf TYT Türkçe’nin en büyük soru bloğu (2018–2025 arası 199 soru) ve dokuz ay süren bir beceridir. Problem rutini ilk dört ay boyunca her güne yayılır.' },
  'minimum-day':{ t:'Minimum gün', b:'Kötü günün alt sınırı: 45 dakika + 15 paragraf + due kartlar.',
    more:'Motivasyon çalışmanın önkoşulu değil, düzenin yan ürünüdür. Hiçbir şey yapamadığın gün bile bu üçünü tutturursan seri kırılmaz.' },
  'block':{ t:'Çalışma bloğu', b:'Gün üç bloğa bölünür: 75 dk ana ders, 65 dk ikinci ders, 40 dk rutin.',
    more:'Bloklar arası 10–15 dakika ara verilir. Blok konusu haftanın üç ana konusundan seçilir; serbestçe değiştirilebilir.' },
  'timer':{ t:'Odak zamanlayıcı', b:'Başlat’a basınca süre kendi işler, bitirince blok otomatik işaretlenir.',
    more:'Gerçekleşen süre elle girilmez; ölçülen süre plan tamamlama ve süre sapması KPI’larını besler.' },
  'skip-reason':{ t:'Atlama nedeni', b:'Atlanan blok suç değil veri: neden seçilir, pazar review’unda kümelenir.',
    more:'İki hafta üst üste düşük tamamlama “irade sorunu” sayılmaz; hedef hacmi azaltılır ve süreç engeli kaldırılır.' },
  'streak':{ t:'Davranış serisi', b:'Ödül nete değil davranışa bağlıdır: minimum standardı tutturduğun gün sayısı.',
    more:'Tek denemede yüksek net ödüllendirilmez. Düzen, analizin zamanında bitmesi ve uyku saatine uyum ödüllendirilir.' },
  'next-action':{ t:'Sıradaki hamle', b:'Ne yapacağını düşünmeden başlaman için tek öncelik gösterilir.',
    more:'Sıra sabittir: analiz borcu → gecikmiş kart → haftanın ritüeli → gecikmiş 2. ölçüm → bekleyen blok → çıpalar.' },
  'sleep':{ t:'Uyku', b:'7–8 saat hedeflenir; uyku bellek pekişmesinin aktif parçasıdır.',
    more:'Son dört haftada kalkış saati sınav sabahına göre kademeli ayarlanır. Haziranda gece çalışmasıyla borç kapatılmaz.' },

  /* --- hafta --- */
  'contract':{ t:'Haftalık sözleşme', b:'En fazla üç ana konu; hedef çıktı temelli yazılır.',
    more:'“Matematik çalış” değil, “rasyonel sayılardan 120 soru, en az %70 doğruluk”. Geçen haftanın verisi görülmeden yeni hedef yazılmaz.' },
  'capacity':{ t:'Kapasite', b:'Planlanan yük kapasitenin %110’unu aşarsa hafta imzalanamaz.',
    more:'Kapasite haftada 21 saat (3–4 saat × 6 gün) varsayılır. Gerçekçi olmayan plan, tamamlama oranını da anlamsız kılar.' },
  'review':{ t:'Weekly review', b:'Pazar 30–40 dakika: planlandı / yapıldı / neden sapıldı / düzeltme.',
    more:'Yeni haftaya yalnız en yüksek etkili iki eksik taşınır; kalan iş otomatik ötelenmez.' },
  'carry':{ t:'Devir', b:'Sonraki haftaya en fazla iki eksik taşınır.',
    more:'Tamamlanmayan her iş taşınırsa plan birikir ve gerçekçiliğini kaybeder.' },

  /* --- deneme --- */
  'net':{ t:'Net hesabı', b:'Net = doğru − yanlış/4. Testler ayrı ayrı hesaplanıp toplanır.' },
  'analysis-protocol':{ t:'Analiz protokolü', b:'Deneme en geç 24 saat içinde 7 adımda çözümlenir.',
    more:'Skor → cevaba bakmadan yeniden çözüm → K/İ/Y/S/D etiketi → somut kök neden → tamir reçetesi → 1 ve 7 gün sonra tekrar → plan etkisi.' },
  'analysis-debt':{ t:'Analiz borcu', b:'Çözülüp analiz edilmeyen deneme, analiz edilenden daha düşük değerlidir.',
    more:'Analiz yetişmiyorsa deneme sayısı azaltılır; hedef daha çok deneme değil, daha iyi çözümlenmiş deneme.' },
  'error-tags':{ t:'Hata etiketleri', b:'K konu, İ işlem, Y yorum, S süre, D dikkat.',
    more:'“Dikkatsizlik” son açıklama değildir; satır kayması, birim atlama gibi somut davranış yazılır. Her etiketin varsayılan reçetesi vardır.' },
  'exam-volume':{ t:'Deneme hacmi', b:'Dönem başına planlanan tam ve branş deneme sayısı.',
    more:'Eylül–Kasım 4–6 tam TYT ile başlar, Nisan–Mayıs’ta 18–22’ye çıkar. Analiz yetişmiyorsa sayı düşürülür.' },
  'publisher':{ t:'Yayın merdiveni', b:'Temel oturmadan üst seviye yayına geçilmez.',
    more:'Aynı hafta üç farklı zorluk karıştırılmaz. Trend için en az üç deneme aynı yayın ailesinden gelmelidir.' },
  'time-drift':{ t:'Süre kaydı', b:'Test başına gerçek süre; net artarken süre bozuluyorsa hız çalışılır.' },

  /* --- tekrar --- */
  'srs':{ t:'Aralıklı tekrar', b:'1 gün → 3 gün → 1 hafta → 1 ay.',
    more:'“Hatırlamadım” döngüyü +1 günden başlatır. “Zorlandım” bir sonraki aralığı açmaz, aynı aralığı tekrarlar.' },
  'card-debt':{ t:'Tekrar borcu', b:'Gecikmiş kart oranı %10’u aşarsa yeni kart üretimi azaltılır.',
    more:'Borç büyürken yeni kart eklemek, tekrar sistemini çöpe çeviren en yaygın hatadır.' },
  'notebook':{ t:'Yanlış defteri', b:'Her yanlış: kök neden, doğru ilke, benzer soru ve tekrar tarihleri.',
    more:'Kapanış ölçütü: soru, çözüme bakılmadan ve süre içinde doğru yapıldıysa kapanır.' },
  'recall':{ t:'İyi kart', b:'Kart tanım değil, geri çağırma sormalı.',
    more:'“Mitokondri nedir?” yerine “Oksijenli solunum basamaklarını yer ve ürünle eşleştir”.' },

  /* --- dersler --- */
  'closure':{ t:'Kapanış kuralı', b:'Konu testi ≥%75 ve 7 gün sonraki test ≥%70 ise konu kapanır.',
    more:'Tek ölçüm kapanış saymaz; bu kural kısa süreli ezberi eler.' },
  'second-check':{ t:'İkinci ölçüm', b:'İlk ölçümden 7 gün sonra yapılan doğrulama testi.',
    more:'Gecikmiş ikinci ölçümler konuyu “geçici kapalı” durumunda bekletir ve kapanış oranını düşürür.' },
  'source-arch':{ t:'Kaynak mimarisi', b:'Temel → orta → seçilmiş zor → branş denemesi sırası.',
    more:'Aynı anda iki ana soru bankası açılmaz. Zor kaynağı bitirmek başarı ölçütü değildir.' },

  /* --- ilerleme --- */
  'median':{ t:'Neden medyan?', b:'Karar tek denemeyle değil, son 3 denemenin medyanıyla verilir.',
    more:'Yayın zorluğu ve kötü gün etkisi ortalamayı bozar; medyan bu gürültüye dayanıklıdır.' },
  'base-score':{ t:'Taban skor', b:'Son 4 denemenin en düşüğü — kötü gün dayanıklılığın.',
    more:'Medyan yükselirken taban düşüyorsa istikrar bozuluyor demektir; yük azaltılır.' },
  'pareto':{ t:'Hata paretosu', b:'En büyük iki etiket gelecek haftaya iki ek blok alır.' },
  'gate':{ t:'Karar kapısı', b:'Ayda bir, medyan bandın neresinde diye bakılır ve tek müdahale seçilir.',
    more:'Tek müdahale 21 gün denenir. Sürekli kaynak değiştirmek, koçlukta en sık görülen hatadır.' },
  'bands':{ t:'Gözlenen / güvenli', b:'Gözlenen: son 3 medyan. Güvenli: ay sonunda iki kez görülen üst bant.' },
  'plan-completion':{ t:'Plan tamamlama', b:'Hedef %85. İki hafta üst üste %80 altı telafi tetikler.' },
  'intensity':{ t:'Çalışma yoğunluğu', b:'Her karenin koyuluğu o günün hedefine göre gerçekleşen yükü gösterir.' },
  'test-trend':{ t:'Test bazlı trend', b:'Hangi test net kazandırıyor, hangisi duruyor.' },

  /* --- hedef --- */
  'rank':{ t:'Puan değil sıra', b:'Yerleştirme başarı sırasıyla yapılır; aynı net farklı yıl farklı sıraya döner.' },
  'tiers':{ t:'Hedef katmanları', b:'Ana / gerçekçi / teminat — üçü birden izlenir.',
    more:'Çukurova Hemşirelik 2026 taban sırası 84.285. Ana hedef bu sıraya tampon bırakır.' },
  'net-matrix':{ t:'Net matrisi', b:'Test başına hedef bant ile güncel medyanın karşılaştırması.' },
  'obp':{ t:'OBP katkısı', b:'Diploma notu × 5, sonra × 0,12 (daha önce yerleşmişse × 0,06).',
    more:'Bu katkı net hedefini mekanik olarak azaltmaz; standartlaştırma nedeniyle sonuç yıldan yıla değişir.' },
  'preferences':{ t:'24 tercih', b:'1–8 agresif, 9–16 gerçekçi, 17–24 güvenli.',
    more:'“Güvenli” gitmeyeceğin bölüm değil, yerleşince kayıt yaptırmaya razı olduğun programdır.' },
  'certainty':{ t:'Kesinlik etiketi', b:'Resmî / 2026 referansı / Tahmin / Koçluk hedefi.',
    more:'Sosyal medya takvimi resmî sayılmaz. İşlem yalnız ÖSYM duyurusu, AİS ekranı ve kılavuzla yapılır.' },

  /* --- telafi --- */
  'protocol':{ t:'Telafi protokolü', b:'Sapma türüne göre adımlı, süreli müdahale planı.',
    more:'Protokoller otomatik tetiklenir ama otomatik uygulanmaz; başlatma kararı sende kalır.' },
  'trigger':{ t:'Tetikleyici', b:'Veriden hesaplanan sapma koşulu.',
    more:'Aynı protokol aktifken yeniden tetiklenmez; kapatırken sonucu yazman sonraki kapıda karşılaştırma sağlar.' },
  'anxiety':{ t:'Sınav kaygısı', b:'Denemeden önce 2 dakika nefes ve sabit başlangıç cümlesi.',
    more:'Kaygı panik atağa veya kalıcı uykusuzluğa dönüşürse profesyonel destek alınır; koçluk klinik tedavi değildir.' },

  /* --- sistem --- */
  'backup':{ t:'Yedek', b:'Veriler bu cihazda tutulur; tarayıcı verisi silinirse kaybolur.',
    more:'Yedek dosyası şema sürümü taşır; içe aktarırken sürüm uyumu kontrol edilir.' },
  'offline':{ t:'Çevrimdışı', b:'Her kayıt önce cihaza yazılır, bağlantı varsa hesaba eşlenir.' },
  'ai-coach':{ t:'AI koç', b:'Hesaplanmış veriyi yorumlar; kararı değiştirmez.',
    more:'Kural motoru otoritedir: kapanış %55 altındayken “yeni kaynak aç” gibi öneriler işaretlenir. Kişisel bilgin gönderilmez.' },
  'risk':{ t:'Konu riski', b:'Frekans, kapanış, açık yanlış, gecikmiş kart ve tazelikten hesaplanan 0–100 skor.',
    more:'Yüksek frekanslı ve kapanmamış bir konu, düşük frekanslı ve kapalı bir konudan daha risklidir. Skor bir emir değil öneri sırasıdır; imzalı haftalık sözleşme her zaman önce gelir.' },
  'estimate':{ t:'Tahmini sıra', b:'Son 3 denemenin medyanından üretilen bant — tek sayı değil.',
    more:'ÖSYM puanı ham netten değil, standartlaştırılmış puandan gelir ve aday dağılımı her yıl değişir. Bu yüzden sonuç aralık olarak verilir ve deneme sayısı arttıkça aralık daralır.' },
  'quiz':{ t:'Sınama', b:'Kart çevirmek tanımadır; sınama üretmeyi ölçer.',
    more:'Cevabı görmeden önce kendine söylemen gerekir. Bilmediğin madde otomatik karta düşer, bildiğin maddenin tekrar aralığı uzar.' },
  'energy':{ t:'Enerji', b:'Günde tek soru: 1 bitkin … 5 yüksek. Plan buna göre esner.',
    more:'Tek günün enerjisi karar vermez; yedi günün ortalaması hedefi kısmak ya da zor konuyu bugüne koymak için kullanılır.' },
  'break':{ t:'Mola', b:'Blok arası 5–15 dakika; ekransız ve kısa.',
    more:'Mola dinlenme değil pekişme aralığıdır. Günde altıdan fazla mola mola değil kaçınmadır; sistem bu eşikte uyarır.' },
  'command':{ t:'Komut paleti', b:'Ctrl+K ile her yere atla, kayıt aç, tema değiştir.' },
};
