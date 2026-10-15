/* SPİ Öğrenme ve Kanıt Katmanı — Desktop.zip veri aktarımı.
   30 kavram, 50 soru, 6 derin analiz, 22 kanıt kartı, 12 spor-beslenme senaryosu.
   Sayılar kural motorundan geçer; kişiye özel doz/teşhis üretilmez. */

window.SP = window.SP || {};

SP.OGRENME_KAVRAMLAR = [
  {
    "id": "concept-tekrar",
    "title": "Tekrar",
    "content_depth": "basit",
    "definition": "Bir hareketin bir tamamlanmış uygulaması kayıt birimidir.",
    "watch": "İki tarafta yapılan harekette toplam ile taraf başına sayımı ayır.",
    "example": "Sağ 6, sol 6: toplam 12; taraf başına 6.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-set",
    "title": "Set",
    "content_depth": "basit",
    "definition": "Birlikte kaydedilen tekrar grubudur.",
    "watch": "Set sayısını tekrar sayısı yerine kullanma.",
    "example": "3 setin tekrarları 8, 7 ve 6: toplam 21 tekrar.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-yuk",
    "title": "Yük",
    "content_depth": "basit",
    "definition": "Kullanılan dış yük birimi ve ekipmanla birlikte yazılır.",
    "watch": "Her el yükü, toplam yük ve bar ağırlığı ayrı açıklanır.",
    "example": "İki adet 8 kg dambıl: her el 8 kg, toplam 16 kg.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-sure",
    "title": "Aktif süre",
    "content_depth": "basit",
    "definition": "Hareket edilen süreyle tüm oturum süresi ayrı tutulur.",
    "watch": "Molalar dahil mi sorusu kayıtta cevaplanır.",
    "example": "20 dakika oturumun 5 dakikası mola ise aktif süre 15 dakikadır.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-tempo",
    "title": "Tempo",
    "content_depth": "basit",
    "definition": "Tekrarın veya ilerleyişin zaman düzenini anlatır.",
    "watch": "Kuvvet tekrar temposuyla koşu temposunun birimleri farklıdır.",
    "example": "Koşu temposu dakika/km, tekrar evreleri saniye olarak yazılabilir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-mesafe",
    "title": "Mesafe",
    "content_depth": "basit",
    "definition": "Gidilen yol veya yükün taşındığı uzunluk kaydıdır.",
    "watch": "Kat sayısını metreye çevirmek için basamak/rota bilgisi gerekir.",
    "example": "20 m taşıma ile 20 saniye taşıma aynı ölçüm değildir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-varyasyon",
    "title": "Varyasyon",
    "content_depth": "basit",
    "definition": "Kurulum, tutuş veya desteği değişen hareket ayrı tanımlanır.",
    "watch": "Eş ad ile farklı varyasyonu ayır.",
    "example": "Glute bridge ve hip thrust üst sırt desteğinde farklıdır.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-ekipman",
    "title": "Ekipman",
    "content_depth": "basit",
    "definition": "Cihaz adı, model ve ayarlar kaydın koşullarıdır.",
    "watch": "Aynı kilogram etiketini farklı cihazlarda otomatik eşitleme.",
    "example": "Makine A 30 kg ile makine B 30 kg ayrı koşullar olarak gösterilir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-taraf",
    "title": "Taraf kaydı",
    "content_depth": "basit",
    "definition": "Sağ ve sol gözlemler ayrı saklanabilir.",
    "watch": "Toplam tekrarı tek taraf sonucu diye gösterme.",
    "example": "Sağ 8 ve sol 7 tekrar, iki taraf da 8 demek değildir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-derinlik",
    "title": "Hareket aralığı",
    "content_depth": "basit",
    "definition": "Başlangıç ve bitiş konumu performans kaydının parçasıdır.",
    "watch": "Aynı tekrar sayısı aynı hareket aralığını garanti etmez.",
    "example": "Squat derinliği değişmiş iki seansı açıklama olmadan kıyaslama.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-hacim",
    "title": "Hacim sayımı",
    "content_depth": "orta",
    "definition": "Hacmin nasıl hesaplandığını belirt; birden fazla tanımı olabilir.",
    "watch": "Set sayısı ve yük×tekrar toplamı farklı ölçülerdir.",
    "example": "2×10×5 kg ile 1×10×10 kg ikisi de 100 kg-tekrar; programlar aynı değildir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-frekans",
    "title": "Sıklık",
    "content_depth": "orta",
    "definition": "Haftada kaç oturum veya hedefe kaç maruziyet kaydedildiğini ayır.",
    "watch": "Tüm salon günleri her kas için aynı çalışma sayısı değildir.",
    "example": "3 salon günü ile belirli hareketin 1 kez yapılması ayrı bilgilerdir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-dinlenme",
    "title": "Set arası dinlenme",
    "content_depth": "orta",
    "definition": "Set bitişi ile sonraki set başlangıcı arasındaki süredir.",
    "watch": "Cihaz bekleme ile planlı dinlenme ayrı işaretlenebilir.",
    "example": "90 sn planlı mola ve 4 dk cihaz bekleme aynı kayıt değildir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-caba",
    "title": "Algılanan çaba",
    "content_depth": "orta",
    "definition": "Öznel çaba kaydının ölçeğini açıkça yaz.",
    "watch": "Kardiyo 0–10 çaba ile farklı ölçekleri karıştırma.",
    "example": "7/10 ifadesi kullanılan ölçek bilinmeden yorumlanmaz.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-rir",
    "title": "Kalan tekrar tahmini",
    "content_depth": "orta",
    "definition": "Kişinin aynı koşulda kaç tekrar daha yapabileceğine ilişkin gözlemidir.",
    "watch": "Tahmin olarak etiketlenir; kesin ölçüm değildir.",
    "example": "2 tekrar kalmış olabilir kaydı, iki tekrarın ölçüldüğü anlamına gelmez.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-met-goreli",
    "title": "MET ve göreli çaba",
    "content_depth": "orta",
    "definition": "MET ile kişinin hissettiği yoğunluk ayrı alanlarda gösterilir.",
    "watch": "Kaynak açıklaması için E09 ve E10 kartlarına bak.",
    "example": "Aynı etkinlik adı iki kişinin aynı çabayı hissettiğini göstermez.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [
      "E09",
      "E10"
    ],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-ort-hiz",
    "title": "Ortalama hız",
    "content_depth": "orta",
    "definition": "Toplam mesafeyi seçilen süreye bölerek hesaplanır.",
    "watch": "Aktif süreyle toplam süre aynı hız sonucunu vermez.",
    "example": "3 km/30 dk = 6 km/sa; 10 dk mola eklendiğinde toplam süre hızı değişir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-kayit-tutarliligi",
    "title": "Kayıt tutarlılığı",
    "content_depth": "orta",
    "definition": "Karşılaştırılan seansların birim ve koşullarını aynı şekilde tanımla.",
    "watch": "Birim değişikliğini gelişim sanma.",
    "example": "Pound ve kilogram aynı sayı alanında birimsiz tutulamaz.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-hedef-ayrimi",
    "title": "Hedef ayrımı",
    "content_depth": "orta",
    "definition": "Kuvvet, dayanıklılık, kas gelişimi ve öğrenme hedefleri ayrı yazılır.",
    "watch": "Tek bir performans ölçüsünü tüm hedeflerin göstergesi yapma.",
    "example": "Tekrar artışı tek başına kas boyutu ölçümü değildir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-gunluk-egilim",
    "title": "Tek seans ve eğilim",
    "content_depth": "orta",
    "definition": "Bir gözlemle tekrarlanan örüntüyü ayrı etiketle.",
    "watch": "Eksik kayıt bulunan günün nedeni kesinleştirilmez.",
    "example": "Bir gün 1 tekrar az yapmak tek başına programın başarısızlığını kanıtlamaz.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-tahmin-olcum",
    "title": "Tahmin ve ölçüm",
    "content_depth": "orta",
    "definition": "Hesaplanan değerle cihaz gözlemini ve gerçek ölçüm yöntemini ayır.",
    "watch": "Her cihaz çıktısına ölçülmüş kalori etiketi verme.",
    "example": "MET tablosundan hesaplanan enerji model tahminidir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-porsiyon",
    "title": "Porsiyon ve spor kaydı",
    "content_depth": "orta",
    "definition": "Gıda gramajı ile antrenman kaydının tarih/bağlamı ayrı saklanır.",
    "watch": "Bir tabak ifadesinin gramajını varsayma.",
    "example": "Kaynak porsiyonu 250 g olsa da tüketilen porsiyon ayrıca girilir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-farkli-makine",
    "title": "Farklı cihazlarda rekor",
    "content_depth": "ileri",
    "definition": "Cihaz değiştiğinde farklı mekanik koşulları birimle beraber göster.",
    "watch": "Eşdeğer direnç veri yoksa sonuç eşitleme.",
    "example": "Yeni cihazın 40 kg etiketi eski cihazın 35 kg etiketinden kesin üstünlük kanıtı değildir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-dolayli-set",
    "title": "Dolaylı çalışma sayımı",
    "content_depth": "ileri",
    "definition": "Birden çok hareketin yardımcı kas katkısını açık sayım yöntemiyle tartış.",
    "watch": "Keyfi katkı katsayısı bilimsel ölçüm gibi gösterilmez.",
    "example": "Pres hareketi için triseps katkısına otomatik 0,5 set yazılmaz.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-ilerleme-secenegi",
    "title": "İlerleme seçenekleri",
    "content_depth": "ileri",
    "definition": "Yük, tekrar, süre, kurulum ve teknik değişikliklerini ayrı gözle.",
    "watch": "İlerleme formülü kişisel reçete gibi çalıştırılmaz.",
    "example": "Tekrar artışıyla birlikte hareket aralığı kısaldıysa değişiklikleri birlikte raporla.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-kanit-populasyon",
    "title": "Kanıtın nüfusu",
    "content_depth": "ileri",
    "definition": "Kaynağın katılımcıları ile hedef kullanıcı grubunu karşılaştır.",
    "watch": "Sağlıklı yetişkin araştırması rehabilitasyona otomatik taşınmaz.",
    "example": "Araştırmada özel hasta grubu yoksa o grupta etki doğrulanmış denemez.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [
      "E06"
    ],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-neden-sonuc",
    "title": "İlişki ve neden",
    "content_depth": "ileri",
    "definition": "Aynı zamanda olan iki değişken neden-sonuç göstermeyebilir.",
    "watch": "Uyku ve performans kaydından tek başına kesin neden çıkarma.",
    "example": "Kısa uyku ile düşük tekrar aynı gün olsa da diğer koşullar sorgulanır.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-takviye-karisim",
    "title": "Takviye karışımı",
    "content_depth": "ileri",
    "definition": "Ürün bileşenleri ve karışımın kendi araştırması ayrı sorgulanır.",
    "watch": "E21 kartı bileşenden ürüne çıkarım sınırını açıklar.",
    "example": "Tek bileşenli çalışma çok bileşenli ürünün aynı etkiyi gösterdiğini kanıtlamaz.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [
      "E21"
    ],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-gorsel",
    "title": "Görsel doğrulama",
    "content_depth": "ileri",
    "definition": "Görselin kayıttaki varyasyonu gösterdiğini kontrol et.",
    "watch": "Depoda URL olması görselin doğru veya lisans kökeninin incelendiği anlamına gelmez.",
    "example": "Ayakta pres görseli oturarak pres kartına otomatik eklenmez.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  },
  {
    "id": "concept-bos-deger",
    "title": "Eksik değer",
    "content_depth": "ileri",
    "definition": "Bilinmeyen veri null olarak ve nedeni ile tutulur.",
    "watch": "Null değeri sıfır sayma.",
    "example": "Bilinmeyen süre, sıfır dakika yapılmış etkinlik değildir.",
    "origin": "Özgün editör öğrenme/kayıt açıklaması; araştırma sonucu yerine geçmez.",
    "evidence_ids": [],
    "review_status": "editör_ve_sayısal_tutarlılık_incelemesi_uzman_incelemesi_bekliyor",
    "ready_for_app": false
  }
];

SP.OGRENME_SORULAR = [
  {
    "id": "q-Pushups",
    "card_id": "pilot-Pushups",
    "type": "açık_cevap",
    "question": "Şınav için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Eller yerdeki şınavı yüksek platform şınavıyla aynı varyasyon sayma.",
    "rubric": "El açıklığı, tamamlanan tekrar ve değişen hareket aralığını ayrı yaz.",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Incline_Push-Up",
    "card_id": "pilot-Incline_Push-Up",
    "type": "açık_cevap",
    "question": "Yüksek platform şınavı için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Duvar şınavıyla platform şınavının kurulumları farklıdır.",
    "rubric": "Platform yüksekliği ve el konumu önceki seansla aynı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Decline_Push-Up",
    "card_id": "pilot-Decline_Push-Up",
    "type": "açık_cevap",
    "question": "Ayakları yükseltilmiş şınav için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "El yükseltisi ile ayak yükseltisini birbirine karıştırma.",
    "rubric": "Ayak desteğinin yüksekliği ve gövde kontrolü kayıtta var mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Push-Up_Wide",
    "card_id": "pilot-Push-Up_Wide",
    "type": "açık_cevap",
    "question": "Geniş el açıklığıyla şınav için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Standart şınav ile tutuş değişikliği ayrı varyasyon olarak izlenir.",
    "rubric": "El açıklığı değiştiğinde tekrar kıyasının koşulları değişti mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Pullups",
    "card_id": "pilot-Pullups",
    "type": "açık_cevap",
    "question": "Üstten tutuş barfiks için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Alt tutuş chin-up ve üst tutuş barfiks ayrı kayıtlardır.",
    "rubric": "Tutuş biçimi, yardım kullanımı ve tekrar standardı aynı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Chin-Up",
    "card_id": "pilot-Chin-Up",
    "type": "açık_cevap",
    "question": "Alt tutuş barfiks için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Üstten tutuş ile alttan tutuşu eş ad olarak birleştirme.",
    "rubric": "Tekrar artışıyla birlikte tutuş veya yardım değişti mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Band_Assisted_Pull-Up",
    "card_id": "pilot-Band_Assisted_Pull-Up",
    "type": "açık_cevap",
    "question": "Bant destekli barfiks için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Destekli barfiksi desteksiz barfiks rekoruyla doğrudan kıyaslama.",
    "rubric": "Bant rengi yerine marka/kalınlık ve kurulum bilgisi yazıldı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Inverted_Row",
    "card_id": "pilot-Inverted_Row",
    "type": "açık_cevap",
    "question": "Bar altında gövde çekişi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Dambıl row ile vücut ağırlığı row farklı yük koşulları taşır.",
    "rubric": "Ayakların uzaklığı veya bar yüksekliği değişti mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Bodyweight_Squat",
    "card_id": "pilot-Bodyweight_Squat",
    "type": "açık_cevap",
    "question": "Vücut ağırlığı squat için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Sandalyeden kalkma farklı başlangıç desteğine sahiptir.",
    "rubric": "Aynı tekrar sayısı farklı çömelme derinliğinde mi yapıldı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Goblet_Squat",
    "card_id": "pilot-Goblet_Squat",
    "type": "açık_cevap",
    "question": "Goblet squat için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Göğüs önünde yük ile iki yanda dambıl yükü ayrı varyasyondur.",
    "rubric": "Yük konumu ve tutuş önceki denemeyle aynı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Dumbbell_Squat",
    "card_id": "pilot-Dumbbell_Squat",
    "type": "açık_cevap",
    "question": "İki yanda dambılla squat için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Toplam yük ve tek dambıl yükü aynı sayı değildir.",
    "rubric": "Kayıttaki kilogram her el için mi, toplam için mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Barbell_Squat",
    "card_id": "pilot-Barbell_Squat",
    "type": "açık_cevap",
    "question": "Sırtta halterle squat için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Halterli squat ile vücut ağırlığı squat teknik ve ekipman açısından ayrı değerlendirilir.",
    "rubric": "Bar ağırlığı toplam yüke dahil edildi mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Butt_Lift_Bridge",
    "card_id": "pilot-Butt_Lift_Bridge",
    "type": "açık_cevap",
    "question": "Zeminde kalça köprüsü için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Üst sırt zeminde mi bank üzerinde mi: varyasyon ayrımı budur.",
    "rubric": "Yük olmadan yapılan hareket ile halterli köprü ayrı mı kaydedildi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Barbell_Glute_Bridge",
    "card_id": "pilot-Barbell_Glute_Bridge",
    "type": "açık_cevap",
    "question": "Halterli zeminde kalça köprüsü için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Bank desteği varsa bu kaynak kaydından farklı hip thrust varyasyonudur.",
    "rubric": "Üst sırt desteği ve toplam bar yükü kayıtlı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Barbell_Hip_Thrust",
    "card_id": "pilot-Barbell_Hip_Thrust",
    "type": "açık_cevap",
    "question": "Bank destekli halter hip thrust için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Zemin köprüsüyle bank destekli hip thrust ayrı hareket kayıtlarıdır.",
    "rubric": "Bank yüksekliği değiştiğinde performans karşılaştırması etkileniyor mu?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Plank",
    "card_id": "pilot-Plank",
    "type": "açık_cevap",
    "question": "Ön kol plank için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Dinamik dead bug ile sabit plank aynı tekrar birimini kullanmaz.",
    "rubric": "Yalnız süre mi, korunan duruş da mı kaydediliyor?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Dead_Bug",
    "card_id": "pilot-Dead_Bug",
    "type": "açık_cevap",
    "question": "Dead bug — bacak uzatma varyasyonu için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Tek bacak uzatma ve çapraz kol-bacak uzatma ayrı varyasyonlardır.",
    "rubric": "Sağ ve sol tekrarlar toplam mı, taraf başına mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Farmers_Walk",
    "card_id": "pilot-Farmers_Walk",
    "type": "açık_cevap",
    "question": "Çiftçi taşıması için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Süreyle ve mesafeyle kaydedilen taşıma farklı ölçümlerdir.",
    "rubric": "Toplam yük, her el yükü ve mesafe ayrı alanlarda mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-One-Arm_Dumbbell_Row",
    "card_id": "pilot-One-Arm_Dumbbell_Row",
    "type": "açık_cevap",
    "question": "Destekli tek kol dambıl çekiş için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Destekli tek kol ve desteksiz eğik gövde çekişi ayrı kurulumdur.",
    "rubric": "Sağ-sol yük ve tekrarlar ayrı mı yazıldı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Seated_Cable_Rows",
    "card_id": "pilot-Seated_Cable_Rows",
    "type": "açık_cevap",
    "question": "Oturarak kablo çekiş için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Makine bloğu kilogramı farklı makinelerde eşit direnç sayılmaz.",
    "rubric": "Sap veya makine değişince önceki yükle doğrudan karşılaştırılıyor mu?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Bent_Over_Barbell_Row",
    "card_id": "pilot-Bent_Over_Barbell_Row",
    "type": "açık_cevap",
    "question": "Eğik gövde halter çekiş için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Bank destekli row ile gövde desteği farklıdır.",
    "rubric": "Tekrar artışında gövde açısı veya savurma da değişti mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Dumbbell_Shoulder_Press",
    "card_id": "pilot-Dumbbell_Shoulder_Press",
    "type": "açık_cevap",
    "question": "Oturarak dambıl omuz presi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Oturarak ve ayakta pres farklı gövde desteği taşır.",
    "rubric": "Bank eğimi ve oturma desteği önceki seansla aynı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Barbell_Shoulder_Press",
    "card_id": "pilot-Barbell_Shoulder_Press",
    "type": "açık_cevap",
    "question": "Oturarak halter omuz presi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Bar ve dambıl presinde yük kayıtları ve hareket yolları ayrıdır.",
    "rubric": "Kaynakta oturarak olan hareket uygulamada ayakta mı gösteriliyor?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Dumbbell_Bench_Press",
    "card_id": "pilot-Dumbbell_Bench_Press",
    "type": "açık_cevap",
    "question": "Dambılla bank presi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Dambıl toplamı ile her el yükü ayrılır.",
    "rubric": "Kayıtta iki dambılın toplamı mı tek dambıl mı yazıldı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Barbell_Bench_Press_-_Medium_Grip",
    "card_id": "pilot-Barbell_Bench_Press_-_Medium_Grip",
    "type": "açık_cevap",
    "question": "Orta tutuş halter bank presi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Dambıl presi ile bar presi aynı ekipman kaydı değildir.",
    "rubric": "Barın kendi ağırlığı ve kullanılan plakalar birlikte hesaplandı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Romanian_Deadlift",
    "card_id": "pilot-Romanian_Deadlift",
    "type": "açık_cevap",
    "question": "Halter Romanian deadlift için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Squat ile kalça menteşesi aynı hareket kalıbı değildir.",
    "rubric": "Aynı yükle farklı alçalma aralığı kullanılıyor mu?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Dumbbell_Lunges",
    "card_id": "pilot-Dumbbell_Lunges",
    "type": "açık_cevap",
    "question": "Dambılla öne hamle için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Öne hamle, geriye hamle ve split squat ayrı varyasyonlardır.",
    "rubric": "Sağ-sol tekrarlar ve adım yönü kayıtlı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Leg_Press",
    "card_id": "pilot-Leg_Press",
    "type": "açık_cevap",
    "question": "Makinede bacak presi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Plaka toplamı farklı makinelerin gerçek direncini eşitlemez.",
    "rubric": "Makine değiştiğinde eski kilogram rekoru aynı kabul ediliyor mu?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Leg_Extensions",
    "card_id": "pilot-Leg_Extensions",
    "type": "açık_cevap",
    "question": "Makinede diz açma için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "NHS leg extension başlığındaki ayakta kalça uzatma başka harekettir.",
    "rubric": "Diz açma ile kalça uzatma isim eşleşmesinde ayrıldı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Lying_Leg_Curls",
    "card_id": "pilot-Lying_Leg_Curls",
    "type": "açık_cevap",
    "question": "Yüzüstü makinede diz bükme için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Oturarak leg curl farklı kalça/gövde kurulumudur.",
    "rubric": "Makine ve ped ayarı önceki kayıtla aynı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Standing_Calf_Raises",
    "card_id": "pilot-Standing_Calf_Raises",
    "type": "açık_cevap",
    "question": "Makinede ayakta baldır yükselişi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Ayakta ve oturarak baldır hareketi ayrı varyasyondur.",
    "rubric": "Aynı tekrar sayısı aynı topuk hareket aralığıyla mı yapıldı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Triceps_Pushdown",
    "card_id": "pilot-Triceps_Pushdown",
    "type": "açık_cevap",
    "question": "Kabloda triseps aşağı itiş için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Düz sap ve ip sapı ayrı ekipman varyasyonu olarak izlenir.",
    "rubric": "Sap değiştiğinde yük/tekrar kıyası aynı koşullarda mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Walking_Treadmill",
    "card_id": "pilot-Walking_Treadmill",
    "type": "açık_cevap",
    "question": "Koşu bandında yürüyüş için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Düz dış ortam yürüyüşü ile eğimli bant yürüyüşü aynı değildir.",
    "rubric": "Seans süresine duraklamalar dahil mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Jogging_Treadmill",
    "card_id": "pilot-Jogging_Treadmill",
    "type": "açık_cevap",
    "question": "Koşu bandında hafif koşu için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Yürüyüş-koşu geçişleri ayrı sürelerle izlenir.",
    "rubric": "Hız değiştiyse fiili süre hangi bölümlere ayrıldı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Running_Treadmill",
    "card_id": "pilot-Running_Treadmill",
    "type": "açık_cevap",
    "question": "Koşu bandında koşu için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Koşu hızı ve algılanan çaba farklı alanlardır.",
    "rubric": "Mesafe artışı süre mi hız mı artışıyla oluştu?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Bicycling",
    "card_id": "pilot-Bicycling",
    "type": "açık_cevap",
    "question": "Dış ortam bisiklet için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Sabit bisiklet ve dış ortam rota koşulları ayrılır.",
    "rubric": "Durma, rüzgar ve eğim bilgileri kayıtta var mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Bicycling_Stationary",
    "card_id": "pilot-Bicycling_Stationary",
    "type": "açık_cevap",
    "question": "Sabit bisiklet için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Aynı direnç numarası farklı bisikletlerde eşit yük değildir.",
    "rubric": "Cihaz modeli ve direnç ayarı değişti mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Recumbent_Bike",
    "card_id": "pilot-Recumbent_Bike",
    "type": "açık_cevap",
    "question": "Yaslanmalı sabit bisiklet için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Dik oturuşlu sabit bisiklet farklı kurulumdur.",
    "rubric": "Koltuk ve cihaz modeli önceki seansla aynı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Elliptical_Trainer",
    "card_id": "pilot-Elliptical_Trainer",
    "type": "açık_cevap",
    "question": "Eliptik cihaz için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Kolların aktif kullanımı kayıtta ayrı koşuldur.",
    "rubric": "Direnç sabitken eğim veya kol katılımı değişti mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Rope_Jumping",
    "card_id": "pilot-Rope_Jumping",
    "type": "açık_cevap",
    "question": "İp atlama için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Tek geçiş ve çift geçiş ayrı koordinasyon varyasyonlarıdır.",
    "rubric": "Toplam seansla fiili atlama süresi ayrıldı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Rowing_Stationary",
    "card_id": "pilot-Rowing_Stationary",
    "type": "açık_cevap",
    "question": "Kürek ergometresi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Dambıl row bir kuvvet hareketidir; kürek cihazıyla aynı değildir.",
    "rubric": "Tempo, mesafe ve cihaz direnç ayarı ayrı mı tutuldu?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Step_Mill",
    "card_id": "pilot-Step_Mill",
    "type": "açık_cevap",
    "question": "Dönen merdiven cihazı için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Step mill ile pedal tipi Stairmaster aynı mekanik cihaz değildir.",
    "rubric": "Kat sayısı yerine süre ve cihaz kademesi kayıtlı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Ankle_Circles",
    "card_id": "pilot-Ankle_Circles",
    "type": "açık_cevap",
    "question": "Ayak bileği daireleri için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Baldır esnetme ile ayak bileği dairesi ayrı hareketlerdir.",
    "rubric": "Daire yönü ve taraf bilgisi kaydedildi mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Cat_Stretch",
    "card_id": "pilot-Cat_Stretch",
    "type": "açık_cevap",
    "question": "Dört ayakta sırt yuvarlama için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Yuvarlama ile dönüşümlü cat-cow akışı ayrı kapsamdadır.",
    "rubric": "Sabit tutuş mu tekrarlı hareket mi kaydedildi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-90_90_Hamstring",
    "card_id": "pilot-90_90_Hamstring",
    "type": "açık_cevap",
    "question": "Sırtüstü 90/90 diz açma için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Pasif partnerli hamstring esnetme başka yöntemdir.",
    "rubric": "Hareket açısı sağ ve solda aynı koşulla mı gözlendi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Standing_Hip_Circles",
    "card_id": "pilot-Standing_Hip_Circles",
    "type": "açık_cevap",
    "question": "Ayakta kalça daireleri için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Yerde yapılan kalça daireleri ayrı başlangıç konumuna sahiptir.",
    "rubric": "Destek miktarı ve gövde dönmesi değişti mi?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Kneeling_Hip_Flexor",
    "card_id": "pilot-Kneeling_Hip_Flexor",
    "type": "açık_cevap",
    "question": "Diz üstü kalça önü esnetme için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Ayakta kalça önü esnetme farklı destek koşuludur.",
    "rubric": "Diz desteği ve gövde hareketi kayıtta var mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Calf_Stretch_Hands_Against_Wall",
    "card_id": "pilot-Calf_Stretch_Hands_Against_Wall",
    "type": "açık_cevap",
    "question": "Duvar destekli baldır esnetme için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Diz açık ve diz bükülü varyasyon aynı kayıt değildir.",
    "rubric": "Arka diz ve ayak yönü önceki gözlemle aynı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Shoulder_Stretch",
    "card_id": "pilot-Shoulder_Stretch",
    "type": "açık_cevap",
    "question": "Kolu gövde önüne alma esnetmesi için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Bu hareket baş üstü triseps esnetmesiyle aynı değildir.",
    "rubric": "Taraf ve gövde dönmesi gözlemde yazıldı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  },
  {
    "id": "q-Upper_Back_Stretch",
    "card_id": "pilot-Upper_Back_Stretch",
    "type": "açık_cevap",
    "question": "Elleri öne uzatarak sırt esnetme için benzer hareketle karıştırılmaması gereken kurulum farkı nedir?",
    "answer": "Kürek çekişi kuvvet hareketi; öne uzatma esnetmesi farklı amaçtır.",
    "rubric": "Sabit tutuş ve dinamik tekrar ayrımı yazıldı mı?",
    "status": "kart_metniyle_tutarlılık_kontrolü_yapıldı_öğrenme_etkinliği_test_edilmedi",
    "ready_for_app": false
  }
];

SP.DERIN_ANALIZLER = [
  {
    "id": "deep-plateau",
    "title": "Gelişim durdu mu, karşılaştırma koşulları mı değişti?",
    "problem": "Kullanıcı önceki hafta 10, bu hafta 8 tekrar yapmış ve programın işe yaramadığını düşünüyor.",
    "levels": [
      {
        "name": "Basit",
        "text": "Önce iki kaydın aynı hareket, yük ve kurulumda olup olmadığını kontrol et."
      },
      {
        "name": "Orta",
        "text": "Hareket sırası, set arası dinlenme ve kullanılan hareket aralığı farklıysa tek başına tekrar sayısını karşılaştırma. Koşul değişikliği notu ekle."
      },
      {
        "name": "İleri",
        "text": "Koşullar aynı görünse bile tek gözlemden neden belirleme. Birden fazla benzer seansın eğilimini, kayıt boşluklarını ve hedef ölçümünü yan yana göster. Kuvvet hedefiyle teknik öğrenme hedefi için aynı başarı ölçütü seçilmiş mi sorgula."
      }
    ],
    "cases": [
      {
        "given": "Önce 10 kg ile 10 tekrar, sonra 12 kg ile 8 tekrar.",
        "interpretation": "Tekrar azalmış, dış yük artmış. Aynı yükte düşüş iddiası desteklenmez; ayrı değişkenler gösterilir."
      },
      {
        "given": "İki seans da 10 kg; son seansta alçalma aralığı kısaltılmış.",
        "interpretation": "Yük aynı olsa da hareket standardı aynı değil. Daha fazla tekrar kesin gelişim kanıtı sayılmaz."
      },
      {
        "given": "Yük ve kurulum aynı; bir seansın dinlenme süresi bilinmiyor.",
        "interpretation": "Bilgi eksikliği görünür tutulur. Yorgunluk, uyku veya program nedeni kesinleştirilmez."
      }
    ],
    "decision": [
      "Varyasyon ve ekipmanı eşleştir.",
      "Yük/tekrar/aralık/dinlenme alanlarını karşılaştır.",
      "Eksik ve değişmiş alanları işaretle.",
      "Aynı koşuldaki tekrarlı gözlemleri ayrı değerlendir."
    ],
    "counterexample": "Daha çok tekrar, daha kısa hareket aralığıyla elde edilmişse yalnız tekrar grafiği başarıyı yanlış anlatabilir.",
    "boundary": "Bu veri incelemesi aşırı antrenman veya sağlık sorunu teşhisi değildir.",
    "origin": "Özgün kurgusal editör analizi",
    "ready_for_app": false,
    "review_status": "bilgi_mimarisi_taslağı_uzman_ve_kullanıcı_incelemesi_bekliyor"
  },
  {
    "id": "deep-volume",
    "title": "Hacim sayıları neden aynı programı anlatmaz?",
    "problem": "İki oturumun yük×tekrar toplamı eşit ve kullanıcı ikisini eşdeğer sanıyor.",
    "levels": [
      {
        "name": "Basit",
        "text": "Hacmin hangi tanımla hesaplandığını yaz."
      },
      {
        "name": "Orta",
        "text": "Set sayısı, tekrar toplamı, yük×tekrar ve hedef kas için çalışma sayımı ayrı gösterilir."
      },
      {
        "name": "İleri",
        "text": "Aynı toplam, farklı hareket, çaba, dinlenme ve ölçüm standardında oluşabilir. Sayım yöntemi değiştirilirse eski seriyle yeni seri doğrudan birleştirilmez. Yardımcı kas katkısı için kaynak olmadan sayısal katsayı atanmaz."
      }
    ],
    "cases": [
      {
        "given": "A: 2 set × 10 tekrar × 5 kg. B: 1 set × 10 tekrar × 10 kg.",
        "interpretation": "Her ikisi 100 kg-tekrar, fakat set sayısı, tekrar toplamı ve yük farklı."
      },
      {
        "given": "Bir kayıtta tek dambıl 8 kg, diğerinde iki dambıl toplamı 16 kg yazıyor.",
        "interpretation": "Aynı hareket iki kat yükle yapılmış olmayabilir; birim kapsamı düzeltilmeden hacim kıyası yapılmaz."
      },
      {
        "given": "Pres ve triseps hareketleri tek kas toplamında otomatik eşit sayılmış.",
        "interpretation": "Doğrudan/dolaylı çalışma yöntemi açıklanmalı; keyfi katsayı ölçüm etiketi taşımaz."
      }
    ],
    "decision": [
      "Hacim tanımını seç ve sakla.",
      "Yük kapsamını açıkla.",
      "Hareket ve kas ailesi ayrımını koru.",
      "Sayım yöntemi değişirse seriyi etiketle."
    ],
    "counterexample": "Eşit kg-tekrar toplamından eşit kas gelişimi sonucu çıkmaz.",
    "boundary": "En iyi kişisel haftalık set dozu bu aritmetik örneklerden belirlenmez.",
    "origin": "Özgün kurgusal editör analizi",
    "ready_for_app": false,
    "review_status": "bilgi_mimarisi_taslağı_uzman_ve_kullanıcı_incelemesi_bekliyor"
  },
  {
    "id": "deep-energy",
    "title": "MET, cihaz kalorisi ve öğün kararı",
    "problem": "Cihazın gösterdiği enerji değeri beslenmeye doğrudan eklenecek kesin kalori olarak görülüyor.",
    "levels": [
      {
        "name": "Basit",
        "text": "Değerin ölçüm mü tahmin mi olduğunu belirt."
      },
      {
        "name": "Orta",
        "text": "Etkinliğin kaynak kodu, yoğunluğu, süre temeli ve kullanıcı bilgileri eksikse hesabın bağlamı da eksiktir."
      },
      {
        "name": "İleri",
        "text": "Aktif süre ile tüm seans süresi, toplam enerji ile dinlenme üstü enerji ve kaynak yaş grubu ayrı kontrol edilir. MET mutlak yoğunluk bilgisidir; kişinin göreli çabası aynı alanda gösterilmez. Sonuç tek bir kesin rakamla öğün kararına bağlanmaz."
      }
    ],
    "cases": [
      {
        "given": "30 dakika oturumun 10 dakikası dinlenme.",
        "interpretation": "20 dakika aktif süre ile 30 dakika tüm oturum farklı girdilerdir; bilinmeyen mola sessizce aktif sayılmaz."
      },
      {
        "given": "İki cihaz aynı etkinlikte farklı kalori veriyor.",
        "interpretation": "Kullanılan model ve bilgiler incelenir; ortalama almak doğrulama sayılmaz."
      },
      {
        "given": "Bir MET kodu 19–59 yaş yetişkin kaynağından, kullanıcı yaş grubu başka.",
        "interpretation": "Kaynak kapsamı görünür tutulur; otomatik yaş uyarlaması yapılmaz."
      }
    ],
    "decision": [
      "Kaynak kodunu ve yoğunluğu tanımla.",
      "Süre temelini netleştir.",
      "Tahmin yöntemini ve yaş kapsamını göster.",
      "Beslenme kaydıyla ilişkiyi gerekçeli ve belirsizlikli tut."
    ],
    "counterexample": "Aynı etkinlik adı farklı tempo, zemin veya duraklama koşullarını tek başına açıklamaz.",
    "boundary": "Bu dosyada yeni kalori modeli veya öğün dozu uygulanmadı.",
    "evidence_ids": [
      "E09",
      "E10",
      "E20"
    ],
    "origin": "Özgün kurgusal editör analizi",
    "ready_for_app": false,
    "review_status": "bilgi_mimarisi_taslağı_uzman_ve_kullanıcı_incelemesi_bekliyor"
  },
  {
    "id": "deep-mapping",
    "title": "Egzersiz adlarını eşleştirirken anlam kaybını önleme",
    "problem": "İsim benzerliği farklı kurulumdaki hareketleri tek kayıtta birleştiriyor.",
    "levels": [
      {
        "name": "Basit",
        "text": "İsmin yanında uygulama adımlarını oku."
      },
      {
        "name": "Orta",
        "text": "Ekipman, gövde desteği, hareket kalıbı ve ölçüm birimini karşılaştır."
      },
      {
        "name": "İleri",
        "text": "Aynı ailede olmak eş anlamlı olmak değildir. Eş ad, varyasyon ve yalnız ilişkili hareket için ayrı ilişki türü sakla. Kaynakta boş talimat varsa eksikliği yeni metin üreterek gizleme; doğru eşlemenin kanıtı eksik kalır."
      }
    ],
    "cases": [
      {
        "given": "Chair_Squat adı sandalyeden kalkma kaydına benziyor.",
        "interpretation": "Kaynak talimatı halterli düzenek içeriyor; sandalyeden kalkma için uygun eş ad değil."
      },
      {
        "given": "NHS Leg extension ile FED Leg_Extensions aynı isimde.",
        "interpretation": "Biri ayakta bacağı geriye alma, diğeri diz açma makinesi. Hareketin konusu farklı."
      },
      {
        "given": "Kalça köprüsünde hip thrust eş adı var.",
        "interpretation": "Üst sırtın zemin/bank desteği ayrı varyasyonlara işaret eder."
      }
    ],
    "decision": [
      "Kaynak kaydın adım ve ekipmanını oku.",
      "Desteği ve eklem hareketini karşılaştır.",
      "Eş ad veya varyasyon ilişkisinin türünü kaydet.",
      "Uyuşmazlığı işaretle ve otomatik birleştirme yapma."
    ],
    "counterexample": "Doğru Türkçe isim tek başına yanlış görsel veya yanlış talimatı düzeltmez.",
    "boundary": "Kaynak talimatlarının teknik doğruluğu ayrıca uzman incelemesi bekler.",
    "origin": "Özgün kurgusal editör analizi",
    "ready_for_app": false,
    "review_status": "bilgi_mimarisi_taslağı_uzman_ve_kullanıcı_incelemesi_bekliyor"
  },
  {
    "id": "deep-program",
    "title": "Programı kişinin hedefi ve takvimiyle açıklamak",
    "problem": "Bir bölünme adı herkes için üstün hazır program gibi sunuluyor.",
    "levels": [
      {
        "name": "Basit",
        "text": "Hedefi, ekipmanı ve kullanılabilir zamanları açıkça yaz."
      },
      {
        "name": "Orta",
        "text": "Seans adı ile hedef kas/movemente maruziyet sayısını ayır. Takvim gününü doz gibi kullanma."
      },
      {
        "name": "İleri",
        "text": "Program alternatiflerinin gerekçesini, kayıt yükünü, eksik ekipmanı ve yeniden değerlendirme sorularını göster. Kaynak değerlendirmesi genel ilkeleri desteklese de özgün bir takvim düzeni kendi başına araştırmayla doğrulanmış olmaz."
      }
    ],
    "cases": [
      {
        "given": "Üç salon günü var, fakat belirli hareket sadece bir kez yapılıyor.",
        "interpretation": "Salon sıklığı ile o hareketin sıklığı ayrı bilgidir."
      },
      {
        "given": "Evde plan için çekiş hareketi gerekir, güvenli ekipman yok.",
        "interpretation": "Eksik alan gösterilir; ev masası isme dayalı otomatik alternatif olmaz."
      },
      {
        "given": "Kullanıcı ileri anlatım kartını açtı.",
        "interpretation": "Bu, ileri fiziksel hareket veya ağır yük için uygunluk onayı değildir."
      }
    ],
    "decision": [
      "Hedef ve kapsamı belirle.",
      "Takvim ve ekipman koşullarını yaz.",
      "Kartları tam varyasyonlarıyla bağla.",
      "Doz ve ilerleme kararını ayrı incele."
    ],
    "counterexample": "İleri düzey kavram öğrenen kişi başlangıç hareketini yapmayı sürdürebilir.",
    "boundary": "Bu eğitim taslakları kişiye atanmış program veya sonuç garantisi değildir.",
    "origin": "Özgün kurgusal editör analizi",
    "ready_for_app": false,
    "review_status": "bilgi_mimarisi_taslağı_uzman_ve_kullanıcı_incelemesi_bekliyor"
  },
  {
    "id": "deep-tactics",
    "title": "İnsanların taktiklerini güvenilir içerik haline getirmek",
    "problem": "Bir kişinin paylaşımı araştırma sonucu gibi kullanıcıya aktarılıyor.",
    "levels": [
      {
        "name": "Basit",
        "text": "Paylaşımın özgün kaynağını ve kişisel deneyim olduğunu göster."
      },
      {
        "name": "Orta",
        "text": "Hedef, önceki deneyim, süre, başka değişiklikler ve olası çıkar ilişkilerini kaydet."
      },
      {
        "name": "İleri",
        "text": "Kişisel deneyim, uzman uygulama önerisi ve araştırma bulgusunu ayrı tut. Eş zamanlı beslenme, ekipman veya program değişiklikleri varsa tek taktiğin etkisini belirlemek mümkün olmayabilir. Çelişen deneyimler çoğunluk oylamasıyla bilimsel doğruluk kararı vermez."
      }
    ],
    "cases": [
      {
        "given": "Kişi bir takviyeden sonra daha çok tekrar yaptığını söylüyor.",
        "interpretation": "Ürün, yük, antrenman geçmişi ve diğer değişiklikler bilinmeden etki kanıtı sayılmaz."
      },
      {
        "given": "Uzman aynı taktiği kendi danışanlarında kullandığını söylüyor.",
        "interpretation": "Uygulama deneyimi değerlidir; araştırma tasarımı ve sonuç kontrolü ayrı bilgidir."
      },
      {
        "given": "Tek bileşenli araştırma çok bileşenli ürünün reklamında kullanılıyor.",
        "interpretation": "Bileşen ile karışımın etkisi/güvenliği ayrı değerlendirilir."
      }
    ],
    "decision": [
      "Özgün kaynak ve içerik türünü kaydet.",
      "Bağlamı ve çıkar ilişkisini sor.",
      "Destekleyici araştırmayı doğrudan iddiayla eşleştir.",
      "Belirsizliği ve aktarılabilirlik sınırını göster."
    ],
    "counterexample": "Çok beğenilmiş bir paylaşım, neden-sonuç kanıtı değildir.",
    "boundary": "Bu pakette gerçek kişilerden taktik derlemesi yapılmadı; örnekler kurgusaldır.",
    "evidence_ids": [
      "E21",
      "E22"
    ],
    "origin": "Özgün kurgusal editör analizi",
    "ready_for_app": false,
    "review_status": "bilgi_mimarisi_taslağı_uzman_ve_kullanıcı_incelemesi_bekliyor"
  }
];

SP.KANIT_KARTLARI = [
  {
    "id": "E01",
    "title": "Kuvvet",
    "claim": "Direnç antrenmanı sağlıklı yetişkinlerde kuvvet ve kas boyutunu geliştirebilir.",
    "source_id": "acsm2026",
    "source_section": "Abstract; Results",
    "scope": "Sağlıklı 18+ yetişkinler; kişisel sonuç garantisi değil.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E02",
    "title": "Yük",
    "claim": "Kuvvet kazanımı için daha ağır yükler değerlendirmede avantaj göstermiştir.",
    "source_id": "acsm2026",
    "source_section": "Abstract; Results",
    "scope": "Başlangıç kişisine doğrudan ağır yük ataması değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E03",
    "title": "Hacim",
    "claim": "Kas gelişiminde daha yüksek haftalık set hacmi avantaj gösterebilir.",
    "source_id": "acsm2026",
    "source_section": "Abstract; Results",
    "scope": "Evrensel en iyi set sayısını belirlemez.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E04",
    "title": "Tükeniş",
    "claim": "Her seti tükenişe götürmek sonuçlar için tutarlı zorunluluk göstermemiştir.",
    "source_id": "acsm2026",
    "source_section": "Abstract; Results",
    "scope": "Her çaba düzeyi eşit demek değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E05",
    "title": "Ekipman",
    "claim": "Ekipman türü sonuçlarda tutarlı üstünlük göstermemiştir.",
    "source_id": "acsm2026",
    "source_section": "Abstract; Results",
    "scope": "Her hareket her kişiye eşit uygun demek değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E06",
    "title": "Kanıt kapsamı",
    "claim": "Değerlendirme çoğunlukla sağlıklı yetişkin direnç antrenmanı araştırmalarını kapsar.",
    "source_id": "acsm2026",
    "source_section": "Eligibility criteria",
    "scope": "Çocuk, rehabilitasyon ve tanılı hastalık için otomatik aktarılmaz.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E07",
    "title": "Konuşma testi",
    "claim": "Orta yoğunlukta kişi genellikle konuşabilir, fakat şarkı söylemek zorlaşır.",
    "source_id": "cdc-intensity",
    "source_section": "Talk Test",
    "scope": "Kaba öznel yoğunluk göstergesi.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E08",
    "title": "Yüksek yoğunluk",
    "claim": "Yüksek yoğunlukta birkaç kelimeden sonra nefes için duraklama gerekebilir.",
    "source_id": "cdc-intensity",
    "source_section": "Talk Test",
    "scope": "Tıbbi değerlendirme veya kesin eşik değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E09",
    "title": "Göreli yoğunluk",
    "claim": "Aynı etkinlik farklı kondisyon düzeylerinde farklı göreli çaba oluşturabilir.",
    "source_id": "cdc-intensity",
    "source_section": "Relative intensity",
    "scope": "Etkinlik adı tek başına kişisel yoğunluğu belirlemez.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E10",
    "title": "MET",
    "claim": "MET mutlak yoğunluğu anlatır; bireysel kondisyonu doğrudan hesaba katmaz.",
    "source_id": "cdc-intensity",
    "source_section": "Absolute intensity",
    "scope": "Kişisel kalori ölçümü değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E11",
    "title": "Yetişkin hareket hedefi",
    "claim": "WHO yetişkinler için haftada 150–300 dakika orta yoğunlukta aerobik aktivite veya eşdeğerini belirtir.",
    "source_id": "who-guide",
    "source_section": "Overview",
    "scope": "Genel sağlık hedefi; ilk haftaya zorunlu yük ataması değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E12",
    "title": "Hareket kapsamı",
    "claim": "Fiziksel aktivite spor dışında ulaşım ve günlük hareketi de kapsar.",
    "source_id": "who",
    "source_section": "What is physical activity?",
    "scope": "Etkinlik sınıflandırması.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E13",
    "title": "Sandalye",
    "claim": "Sandalyeden kalkma için sağlam, kaymayan sandalye seçimi önemlidir.",
    "source_id": "nhs-strength",
    "source_section": "Introduction; Sit-to-stand",
    "scope": "Chair_Squat adlı halterli kaynak kaydıyla eş anlamlı değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E14",
    "title": "Duvar şınavı",
    "claim": "NHS duvar şınavını ayrı bir evde kuvvet hareketi olarak açıklar.",
    "source_id": "nhs-strength",
    "source_section": "Wall press-up",
    "scope": "Platform şınavıyla aynı kurulum değildir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E15",
    "title": "Denge desteği",
    "claim": "NHS denge çalışmasında duvar veya sağlam sandalye yakınında destek önerir.",
    "source_id": "nhs-balance",
    "source_section": "Introduction",
    "scope": "Düşme riskini yok ettiği iddia edilmez.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E16",
    "title": "Esneklik kapsamı",
    "claim": "NHS esneklik dizisinde boyun ve baldır hareketleri ayrı anlatılır.",
    "source_id": "nhs-flex",
    "source_section": "Neck rotation; Calf stretch",
    "scope": "Tüm mobilite hareketlerine tek doz atanmaz.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E17",
    "title": "Omuz ağrısı",
    "claim": "NHS omuz ağrısını kötüleştiren faaliyetlerden kaçınmayı belirtir.",
    "source_id": "nhs-shoulder",
    "source_section": "Don’t",
    "scope": "Ağrı nedenini belirlemeden kurbağalama reçetesi desteklenmez.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E18",
    "title": "Uyku",
    "claim": "CDC yeterli uyku süresiyle birlikte uyku niteliğini de önemser.",
    "source_id": "cdc-sleep",
    "source_section": "Sleep quality",
    "scope": "Tek bir puan antrenman iznini belirlemez.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E19",
    "title": "Uyku yaşı",
    "claim": "CDC 18–60 yaş için günde en az 7 saat uyku belirtir.",
    "source_id": "cdc-sleep",
    "source_section": "Getting enough sleep",
    "scope": "Diğer yaş gruplarına aynı eşik taşınmaz.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E20",
    "title": "Spor beslenmesi",
    "claim": "Yeterli beslenme ve sıvı alımı spor performansının temelidir.",
    "source_id": "nih-sport",
    "source_section": "Introduction",
    "scope": "Kişisel beslenme dozları değerlendirilmedi.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E21",
    "title": "Karışım",
    "claim": "Tek bileşen araştırması çok bileşenli takviye karışımının etkisini göstermez.",
    "source_id": "nih-sport",
    "source_section": "Selected Ingredients",
    "scope": "Ürün etkisi ve güvenliği ayrı değerlendirilir.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  },
  {
    "id": "E22",
    "title": "Araştırma sınırı",
    "claim": "Takviye araştırmalarının katılımcı ve ölçüm koşulları genellenebilirliği sınırlar.",
    "source_id": "nih-sport",
    "source_section": "Introduction",
    "scope": "Profesyonel sporcu verisi yeni başlayana otomatik aktarılmaz.",
    "review_status": "kaynak_bölümüyle_eşlendi_bağımsız_uzman_incelemesi_yok",
    "checked_at": "2026-10-12",
    "ready_for_app": false
  }
];

SP.SPOR_BESLENME = [
  {
    "id": "nutrition-kalori-ekleme",
    "situation": "Cihaz 400 kcal gösterdi",
    "missing_information": "Cihazın kullandığı yöntem, süre, ağırlık bilgisi ve toplam/net enerji ayrımı",
    "editor_action": "Ekran değerini tahmini olarak tut; aynı miktarda yemek eklemeyi otomatik karar yapma.",
    "evidence_ids": [
      "E10",
      "E20"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-protein-gram",
    "situation": "İki protein kaydının gramı farklı",
    "missing_information": "Porsiyon gramı, 100 g temeli ve gıdanın pişmiş/çiğ biçimi",
    "editor_action": "Önce aynı temelde karşılaştır; günlük hedef dozu bu örnekten çıkarma.",
    "evidence_ids": [
      "E20"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-antrenman-oncesi",
    "situation": "Antrenman öncesi öğün seçimi",
    "missing_information": "Etkinlik türü, süre, öğün zamanı ve kişinin tolerans kaydı",
    "editor_action": "Öğün örneğini bağlamıyla tut; herkese sabit saat ve porsiyon verme.",
    "evidence_ids": [
      "E20"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-uzun-etkinlik",
    "situation": "Uzun etkinlik ile kısa salon seansı",
    "missing_information": "Gerçek etkinlik süresi, ortam ve beslenme geçmişi",
    "editor_action": "İki etkinliğe aynı sıvı/enerji örneğini zorunlu kılma.",
    "evidence_ids": [
      "E20"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-sicaklik",
    "situation": "Sıcak ortamda antrenman kaydı",
    "missing_information": "Ortam, süre, gözlemler ve sıvı kaydının birimi",
    "editor_action": "Sabit litre reçetesi yerine eksik bağlamı görünür tut.",
    "evidence_ids": [
      "E20"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-kafein",
    "situation": "Takviyede kafein miktarı belirsiz",
    "missing_information": "Etiket, porsiyon, bileşen miktarları ve kullanım saati",
    "editor_action": "Etiket belirsizliğini işaretle; doz veya etkileşim kararı üretme.",
    "evidence_ids": [
      "E21",
      "E22"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-kreatin",
    "situation": "Bir kişinin kreatin deneyimi",
    "missing_information": "Gerçek kaynak, antrenman geçmişi, diğer değişiklikler ve ürün bilgisi",
    "editor_action": "Kişisel deneyimi araştırma sonucu olarak etiketleme.",
    "evidence_ids": [
      "E22"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-karisim",
    "situation": "Çok bileşenli spor ürünü",
    "missing_information": "Her bileşenin miktarı ve ürünün kendi araştırması",
    "editor_action": "Bileşen araştırmalarıyla karışımın etkisini otomatik doğrulama.",
    "evidence_ids": [
      "E21"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-vejetaryen",
    "situation": "Vejetaryen sporcu öğün örneği",
    "missing_information": "Gerçek tüketim gramları, tarif ve toplam gün kaydı",
    "editor_action": "Yalnız öğün adıyla yeterlilik veya eksiklik ilan etme.",
    "evidence_ids": [
      "E20"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-butce",
    "situation": "Bütçeye göre protein kıyası",
    "missing_information": "Güncel fiyat, yenebilir gram, pişirme kaybı ve kaynak besin değeri",
    "editor_action": "Eski fiyatı canlı fiyat gibi sunma; örnek hesabın tarihini tut.",
    "evidence_ids": [
      "E20"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-vucut-agirligi",
    "situation": "Tek gün tartı değişimi",
    "missing_information": "Ölçüm saati, koşullar ve tekrarlı ölçümler",
    "editor_action": "Bir değişimi otomatik kas artışı veya yağ kaybı diye adlandırma.",
    "evidence_ids": [],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  },
  {
    "id": "nutrition-uyku-beslenme",
    "situation": "Geç öğün ve uyku kaydı",
    "missing_information": "Öğün saati, uyku niteliği, kafein ve diğer koşullar",
    "editor_action": "Eş zamanlı gözlemi tek başına neden-sonuç sayma.",
    "evidence_ids": [
      "E18"
    ],
    "origin": "Kurgusal özgün editör senaryosu",
    "dose": null,
    "ready_for_app": false,
    "review_status": "beslenme_uzman_incelemesi_bekliyor"
  }
];

SP.SPOR_KAYNAKLAR = [
  {
    "id": "fed",
    "title": "Free Exercise DB",
    "url": "https://github.com/yuhonas/free-exercise-db",
    "accessed": "2026-10-12",
    "review": "Kaynak JSON, lisans ve şema indirildi; 876 kaydın biçimi incelendi.",
    "rights": "Unlicense; kaynak depo beyanı. Görsel kökeni bağımsız incelenmedi.",
    "full_scientific_verification": false
  },
  {
    "id": "acsm2026",
    "title": "ACSM 2026 direnç antrenmanı değerlendirmesi",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/",
    "accessed": "2026-10-12",
    "review": "Özet, kapsam ve değişken tanımları incelendi; tüm tablolar bağımsız değerlendirilmedi.",
    "rights": "CC BY-NC-ND 4.0; makale veya görseller yeniden paketlenmedi, kısa özgün bilgi özeti.",
    "full_scientific_verification": false
  },
  {
    "id": "cdc-intensity",
    "title": "CDC fiziksel aktivite yoğunluğu",
    "url": "https://www.cdc.gov/physical-activity-basics/measuring/index.html",
    "accessed": "2026-10-12",
    "review": "Yoğunluk, konuşma testi ve MET açıklamaları incelendi.",
    "rights": "Kısa özgün özet; görsel indirilmedi.",
    "full_scientific_verification": false
  },
  {
    "id": "who",
    "title": "WHO fiziksel aktivite",
    "url": "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    "accessed": "2026-10-12",
    "review": "Genel aktivite kapsamı incelendi.",
    "rights": "Kısa özgün özet, tam metin kopyalanmadı.",
    "full_scientific_verification": false
  },
  {
    "id": "who-guide",
    "title": "WHO hareket kılavuzu özeti",
    "url": "https://www.who.int/europe/publications/i/item/9789240014886",
    "accessed": "2026-10-12",
    "review": "Yetişkin hedefleri ve yaş kapsamı kontrol edildi.",
    "rights": "Kaynak bağlantısı; tam kılavuz yeniden dağıtılmadı.",
    "full_scientific_verification": false
  },
  {
    "id": "nhs-strength",
    "title": "NHS evde kuvvet hareketleri",
    "url": "https://www.nhs.uk/live-well/exercise/strength-exercises/",
    "accessed": "2026-10-12",
    "review": "Sandalyeden kalkma, duvar şınavı ve kurulum incelendi.",
    "rights": "Kısa özgün özet; medya indirilmedi.",
    "full_scientific_verification": false
  },
  {
    "id": "nhs-flex",
    "title": "NHS esneklik hareketleri",
    "url": "https://www.nhs.uk/live-well/exercise/flexibility-exercises/",
    "accessed": "2026-10-12",
    "review": "Boyun, yan eğilme ve baldır hareket kapsamı incelendi.",
    "rights": "Kısa özgün özet; medya indirilmedi.",
    "full_scientific_verification": false
  },
  {
    "id": "nhs-balance",
    "title": "NHS denge hareketleri",
    "url": "https://www.nhs.uk/live-well/exercise/balance-exercises/",
    "accessed": "2026-10-12",
    "review": "Yan yürüme, topuk-parmak yürüyüşü, tek ayak ve basamak incelendi.",
    "rights": "Kısa özgün özet; medya indirilmedi.",
    "full_scientific_verification": false
  },
  {
    "id": "nhs-adults",
    "title": "NHS yetişkin aktivite kılavuzu",
    "url": "https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/",
    "accessed": "2026-10-12",
    "review": "19–64 yaş kapsamı ve genel öneriler incelendi.",
    "rights": "Kaynak bağlantısı ve kısa özet.",
    "full_scientific_verification": false
  },
  {
    "id": "nhs-walking",
    "title": "NHS yürüyüş",
    "url": "https://www.nhs.uk/live-well/exercise/walking-for-health/",
    "accessed": "2026-10-12",
    "review": "Yürüyüş sayfası incelendi; ayrıntılı hareket eşlemesi yok.",
    "rights": "Kaynak bağlantısı.",
    "full_scientific_verification": false
  },
  {
    "id": "nhs-shoulder",
    "title": "NHS omuz ağrısı",
    "url": "https://www.nhs.uk/symptoms/shoulder-pain/",
    "accessed": "2026-10-12",
    "review": "Ağrıyı kötüleştiren faaliyet ve değerlendirme kapsamı incelendi.",
    "rights": "Kısa özgün özet; tedavi talimatı çıkarılmadı.",
    "full_scientific_verification": false,
    "page_last_reviewed": "2023-05-22",
    "page_next_review_due": "2026-05-22",
    "currency_note": "Kaynak sayfanın kendi planlı inceleme tarihi erişim tarihinde geçmiş; klinik içerik için güncellik ve bağımsız kaynak incelemesi gerekiyor."
  },
  {
    "id": "cdc-sleep",
    "title": "CDC uyku",
    "url": "https://www.cdc.gov/sleep/about/index.html",
    "accessed": "2026-10-12",
    "review": "Yaş tabloları ve uyku niteliği incelendi.",
    "rights": "Kısa özgün özet; medya indirilmedi.",
    "full_scientific_verification": false
  },
  {
    "id": "nih-sport",
    "title": "NIH ODS spor ve takviyeler",
    "url": "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/",
    "accessed": "2026-10-12",
    "review": "Giriş, beslenme temeli ve karışım/araştırma sınırları incelendi; tüm ürünler incelenmedi.",
    "rights": "Kısa özgün özet; ürün veri tabanı değildir.",
    "full_scientific_verification": false
  },
  {
    "id": "compendium",
    "title": "2024 Adult Compendium",
    "url": "https://pacompendium.com/adult-compendium/",
    "accessed": "2026-10-12",
    "review": "Önceki pakette 1.111 MET kodu; spor hareketleriyle tekil eşleşme henüz tamamlanmadı.",
    "rights": "Önceki paket referansı; açıklamalar kopyalanmadı.",
    "full_scientific_verification": false
  }
];
