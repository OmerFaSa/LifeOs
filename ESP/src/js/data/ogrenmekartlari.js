/* ESP Ayrıntılı Öğrenme ve Pedagoji Kartları (68 Konu)
   Kaynak: esp-veriseti & esp-profesyonel-v4
   Her kart ESP.TOPICS içindeki bir konuya (esp_topic_id) doğrudan bağlıdır. */

window.ESP = window.ESP || {};

ESP.OGRENME_KARTLARI = [
  {
    "id": "lesson-l-ses",
    "esp_topic_id": "l-ses",
    "discipline": "lang",
    "title": "Ses ve alfabe",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Hedef dilin seslerini tanımak ve yazıyla eşleştirmek.",
    "explanation": "Ses, harf ve yazım aynı nesne değildir. Çalışmada duyulan ses ile onu gösteren yazıyı ayrı kaydet; doğru yazmak doğru sesletimin ölçümü değildir.",
    "worked_example": {
      "text": "Özgün İngilizce örnek: ship ve sheep farklı sözcüklerdir. Yazımı kopyalamak ses ayrımını göstermek için yeterli olmaz.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Örnek ses dosyası yokken telaffuz doğrulandı denmesi.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Yazılı sözcük eşleştirmesi sesletim doğruluğunu neden kanıtlamaz?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Yazılı sözcük eşleştirmesi sesletim doğruluğunu neden kanıtlamaz?",
      "expected_answer": "Yazı ile ses farklı üretim/algı görevleridir; ses örneği ve değerlendirmesi gerekir."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; örnek ses dosyası yokken telaffuz doğrulandı denmesi.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Alfabe ve sesletim",
      "Ana dilde olmayan sesler",
      "Vurgunun kelimedeki yeri",
      "Yazıldığı gibi okunmayan kalıplar"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-gunluk",
    "esp_topic_id": "l-gunluk",
    "discipline": "lang",
    "title": "Günlük hayat",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Selamlaşma, tanışma, sayı, saat, yön.",
    "explanation": "Günlük dilde sözcüğü bağlamıyla kullan. İstek, bilgi sorusu ve teşekkür farklı iletişim görevleridir; tek karşılık ezberi bütün görevleri ölçmez.",
    "worked_example": {
      "text": "Özgün örnek: I need a ticket. / Could I have a ticket, please? Aynı ihtiyacın farklı ifade yolları.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir sözcüğün Türkçe karşılığını her cümlede zorunlu aynı çeviri saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu iki örnekte ortak ihtiyaç ve farklı söyleyiş nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu iki örnekte ortak ihtiyaç ve farklı söyleyiş nedir?",
      "expected_answer": "İkisinde de bilet isteniyor; biri ihtiyacı belirtir, diğeri isteği soru biçiminde sunar."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir sözcüğün türkçe karşılığını her cümlede zorunlu aynı çeviri saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Selamlaşma ve vedalaşma",
      "Kendini tanıtma",
      "Sayılar ve saat",
      "Yön sorma ve tarif etme",
      "Alışveriş kalıpları"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-zaman",
    "esp_topic_id": "l-zaman",
    "discipline": "lang",
    "title": "Zaman ve anlatım",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Geçmişi, şimdiyi ve geleceği kaymadan anlatmak.",
    "explanation": "Fiil biçimiyle zaman bağlamını birlikte oku. Yalnız zaman zarfını tanımak cümlenin bütün dilbilgisel yapısını çözmek değildir.",
    "worked_example": {
      "text": "Özgün örnek: I walked yesterday. / I walk every day. İlkinde tamamlanmış geçmiş olay, ikincisinde alışkanlık örneği var.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Aynı fiilin kökünü bilip biçim değişikliğini görmezden gelmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu iki cümlede olayın zaman bağlamını hangi öğeler birlikte gösteriyor?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu iki cümlede olayın zaman bağlamını hangi öğeler birlikte gösteriyor?",
      "expected_answer": "walked/yesterday ve walk/every day eşleşmeleri birlikte incelenir."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; aynı fiilin kökünü bilip biçim değişikliğini görmezden gelmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Geçmiş zamanlar ve görünüş",
      "Gelecek ve niyet",
      "Sıklık zarfları",
      "Bir günü baştan sona anlatma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-betim",
    "esp_topic_id": "l-betim",
    "discipline": "lang",
    "title": "Betimleme",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Kişi, yer ve nesneyi ayrıntılı anlatmak.",
    "explanation": "Betimleme yalnız sıfat listesi değildir; nesneyi seçip gözlenebilir ayrıntıları düzenleyerek okuyucuya ayırt etme imkânı verir.",
    "worked_example": {
      "text": "Özgün örnek: The room is small. It has two windows. Boyut yargısı ve sayılabilir ayrıntı ayrı.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Gözlemle kişisel izlenimi tek kanıt türü saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte hangi bilgi sayılabilir, hangisi bağlama göre değişebilir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte hangi bilgi sayılabilir, hangisi bağlama göre değişebilir?",
      "expected_answer": "İki pencere sayılabilir; small karşılaştırma bağlamı gerektirir."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; gözlemle kişisel izlenimi tek kanıt türü saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Sıfat sırası",
      "Karşılaştırma ve üstünlük",
      "Mekân ve yer edatları",
      "Duygu ve durum anlatımı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-baglanti",
    "esp_topic_id": "l-baglanti",
    "discipline": "lang",
    "title": "Bağlantılı metin",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Cümleleri neden, karşıtlık ve koşulla bağlamak.",
    "explanation": "Bağlayıcılar cümleler arası ilişkiyi görünür yapar. Bağlayıcı eklemek, ilişki gerçekten kurulmadıysa metni tutarlı hale getirmez.",
    "worked_example": {
      "text": "Özgün örnek: It was raining, so we stayed inside. so burada gerekçelendirme bağını işaretliyor.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Her cümleye bağlaç ekleyip ilişkiyi açıklamamak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte neden olarak sunulan bilgi ve sonuç hangisi?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte neden olarak sunulan bilgi ve sonuç hangisi?",
      "expected_answer": "Yağmur neden olarak, içeride kalma sonuç olarak sunuluyor."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; her cümleye bağlaç ekleyip ilişkiyi açıklamamak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Bağlaçlar ve geçiş ifadeleri",
      "Yan cümle kurma",
      "Paragraf içinde akış",
      "Anlatıda zaman sıçraması"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-kiplik",
    "esp_topic_id": "l-kiplik",
    "discipline": "lang",
    "title": "Kiplik ve incelik",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Gereklilik, olasılık, izin ve rica arasındaki farkı üretmek.",
    "explanation": "Kesinlik, olasılık ve yükümlülük aynı iddia gücünü taşımaz. Sözcük seçimi yorumun hangi ölçüde iddia edildiğini değiştirir.",
    "worked_example": {
      "text": "Özgün örnek: It might rain. / It must be checked. Olasılık bildirimiyle kontrol gerekliliği farklıdır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Kip sözcüğünü bağlamdan bağımsız tek Türkçe karşılığa kapatmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekler aynı tür iddia mı kuruyor?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekler aynı tür iddia mı kuruyor?",
      "expected_answer": "Hayır; biri olasılık, diğeri kontrol gereği bildiriyor."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; kip sözcüğünü bağlamdan bağımsız tek türkçe karşılığa kapatmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Gereklilik ve zorunluluk",
      "Olasılık dereceleri",
      "Kibar rica kalıpları",
      "Dolaylı anlatım"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-tartisma",
    "esp_topic_id": "l-tartisma",
    "discipline": "lang",
    "title": "Tartışma ve savunma",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Bir görüşü savunmak, kısmen katılmak, karşı çıkmak.",
    "explanation": "Savunmada tez, gerekçe ve karşı görüşün en güçlü biçimi ayrı yazılır. Akıcı konuşmak gerekçeyi doğru veya yeterli yapmaz.",
    "worked_example": {
      "text": "Kurgusal tez: Kütüphane geç kapanmalı. Gerekçe: Akşam çalışanlar da erişebilmeli. İtiraz: Personel maliyeti.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Karşı görüşü yalnız alay edilebilir zayıf biçimiyle sunmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu tartışmada hangi eksik bilgi kararın değerlendirmesini değiştirir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu tartışmada hangi eksik bilgi kararın değerlendirmesini değiştirir?",
      "expected_answer": "Erişim ihtiyacı, personel maliyeti ve uygulanabilir saat seçenekleri."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; karşı görüşü yalnız alay edilebilir zayıf biçimiyle sunmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Katılma ve kısmen katılma",
      "Karşı çıkma kalıpları",
      "Örnek ve kanıt sunma",
      "Karşı tarafın itirazını önceden karşılama"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-akademik",
    "esp_topic_id": "l-akademik",
    "discipline": "lang",
    "title": "Kayıt ve üslup",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Günlük, resmî ve akademik kaydı ayırmak.",
    "explanation": "Kayıt ve üslup, hedef okur ve iletişim görevine göre değişir. Resmî sözcük eklemek tek başına akademik kanıt üretmez.",
    "worked_example": {
      "text": "Kurgusal çift: Bu iş çok iyi. / Bu yaklaşımın hangi ölçütte başarılı olduğu belirtilmelidir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Süslenmiş dilin gerekçe eksikliğini gizlemesine izin vermek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "İkinci cümle ilk yargının hangi eksiğini görünür kılıyor?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "İkinci cümle ilk yargının hangi eksiğini görünür kılıyor?",
      "expected_answer": "Başarının ölçütünü ve kanıtını istemeyi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; süslenmiş dilin gerekçe eksikliğini gizlemesine izin vermek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Resmî yazışma kalıpları",
      "Akademik fiil ve öbekler",
      "Edilgen yapı ve fail gizleme",
      "Aynı fikri iki kayıtta yazma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-aracilik",
    "esp_topic_id": "l-aracilik",
    "discipline": "lang",
    "title": "Aracılık (mediation)",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Bir metni ya da konuşmayı başkası için anlaşılır kılmak.",
    "explanation": "Aracılık, başkasının anlamasına yardımcı olmak için bilgiyi seçip açıklama görevidir. Kısaltırken koşulları ve belirsizliği kaybetme.",
    "worked_example": {
      "text": "Kurgusal duyuru: Başvurular cuma kapanır; eksik belge için ek süre yok. Arkadaşına son tarih ve koşulu birlikte anlat.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Yalnız son tarihi aktararak koşulu düşürmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Duyurunun hangi iki öğesi birlikte korunmalı?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Duyurunun hangi iki öğesi birlikte korunmalı?",
      "expected_answer": "Son tarih ve eksik belgede ek süre olmaması koşulu."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; yalnız son tarihi aktararak koşulu düşürmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Metni özetleyip aktarma",
      "İki dil arasında köprü kurma",
      "Kavramı sadeleştirerek anlatma",
      "Grup tartışmasını kolaylaştırma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-cevrimici",
    "esp_topic_id": "l-cevrimici",
    "discipline": "lang",
    "title": "Çevrim içi etkileşim",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Yazılı ve eşzamanlı çevrim içi ortamda dil kullanmak.",
    "explanation": "Çevrim içi etkileşimde mesaj sırası, alıntılanan bölüm ve yanıtın kime ait olduğu anlaşılmalıdır. Kısa cevap bağlam olmadan belirsizleşebilir.",
    "worked_example": {
      "text": "Kurgusal konuşmada iki farklı saat öneriliyor. Tamam mesajı hangi saati kabul ediyor?",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Belirsiz yanıtı sistemin kendiliğinden çözmesi.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Belirsizliği gidermek için hangi bilgi açık yazılır?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Belirsizliği gidermek için hangi bilgi açık yazılır?",
      "expected_answer": "Kabul edilen gün/saat ve hangi mesaja yanıt verildiği."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; belirsiz yanıtı sistemin kendiliğinden çözmesi.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Yazışmada ton ayarı",
      "Çevrim içi tartışmaya katılma",
      "İşbirlikli belge üzerinde çalışma",
      "Yanlış anlaşılmayı onarma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-l-deyim",
    "esp_topic_id": "l-deyim",
    "discipline": "lang",
    "title": "Deyim, ima ve mizah",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Söylenmeyeni anlamak ve kurabilmek.",
    "explanation": "Deyim ve ima, bağlam ve ortak bilgiyle değerlendirilir. Sözlük karşılığı tek başına mizahı veya konuşanın niyetini kesinleştirmez.",
    "worked_example": {
      "text": "Kurgusal Türkçe cümle: Harika, yine yağmur! Sözcükler olumlu olsa da durum ve söyleyiş yorum için önemlidir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir cümleyi her durumda otomatik alay diye etiketlemek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "İroni yorumunu hangi eksik bilgiler değiştirebilir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "İroni yorumunu hangi eksik bilgiler değiştirebilir?",
      "expected_answer": "Durum, tonlama, önceki konuşma ve konuşanın amacı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir cümleyi her durumda otomatik alay diye etiketlemek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Deyim ve eşdizim ağı",
      "İroni ve alt metin",
      "Kültürel gönderme",
      "Kelime oyunu"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-mantik",
    "esp_topic_id": "p-mantik",
    "discipline": "philo",
    "title": "Mantık ve argüman",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Öncül ile sonucu ayırmak, geçerlilik ile doğruluğu karıştırmamak.",
    "explanation": "Argümanda kabul edilmesi istenen sonuç ile onu destekleyen öncülleri ayır. Geçerli çıkarım, öncüllerin gerçekte doğru olduğunu tek başına göstermez.",
    "worked_example": {
      "text": "Kurgusal biçim: Bütün A lar B dir. x bir A dır. O halde x B dir. Biçim ile ilk öncülün doğruluğu ayrı incelenir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Sonuç hoşuna gittiği için öncülleri denetlememek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu biçimde hangi iki değerlendirme ayrı tutulmalı?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu biçimde hangi iki değerlendirme ayrı tutulmalı?",
      "expected_answer": "Çıkarımın biçimi ve öncüllerin doğruluğu."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; sonuç hoşuna gittiği için öncülleri denetlememek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Öncül–sonuç ayrımı",
      "Geçerlilik ve sağlamlık",
      "Tümdengelim ve tümevarım",
      "Safsata kataloğu",
      "Gizli öncül avı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-bilgi",
    "esp_topic_id": "p-bilgi",
    "discipline": "philo",
    "title": "Bilgi kuramı",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "«Biliyorum» demenin koşullarını tartışmak.",
    "explanation": "Bir iddiaya inanmak, iddianın doğru olması ve bu inancın nasıl gerekçelendiği farklı sorulardır. Bilgi kuramındaki tartışmayı tek sloganla kapatma.",
    "worked_example": {
      "text": "Kurgusal örnek: Bir tahmin tesadüfen doğru çıkıyor. Doğru sonuç, kullanılan yöntemin güvenilirliğini otomatik göstermez.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Doğru çıkan tek tahmini güvenilir bilgi yöntemi saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Tesadüfi doğrulukla gerekçelendirme arasındaki fark nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Tesadüfi doğrulukla gerekçelendirme arasındaki fark nedir?",
      "expected_answer": "Sonucun doğru çıkması ile ona inanmak için dayanağın niteliği ayrıdır."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; doğru çıkan tek tahmini güvenilir bilgi yöntemi saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Gerekçelendirilmiş doğru inanç",
      "Şüphecilik",
      "Akılcılık ve deneycilik",
      "Tanıklık ve otorite",
      "Gettier sorunu"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-etik",
    "esp_topic_id": "p-etik",
    "discipline": "philo",
    "title": "Etik",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Üç büyük ahlak kuramını ayırt etmek ve sınamak.",
    "explanation": "Etik çözümlemede eylem, sonuç, gerekçe ve karakter değerlendirmesini ayrı sorular olarak ele al. Bir yaklaşımın adını bilmek somut durumu çözmüş olmak değildir.",
    "worked_example": {
      "text": "Kurgusal durum: Bir arkadaşını korumak için bilgi saklamak. Etkilenenleri ve saklanan bilginin önemini yaz.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir cümleden bütün etik geleneklerin aynı kararını çıkarmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu durumda yargıdan önce hangi bilgileri netleştirmelisin?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu durumda yargıdan önce hangi bilgileri netleştirmelisin?",
      "expected_answer": "Saklanan bilgi, etkilenenler, amaç, sonuç ihtimalleri ve gerekçe."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir cümleden bütün etik geleneklerin aynı kararını çıkarmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Erdem etiği",
      "Ödev etiği (deontoloji)",
      "Sonuççuluk",
      "Ahlaki görelilik tartışması",
      "Uygulamalı etik vakaları"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-varlik",
    "esp_topic_id": "p-varlik",
    "discipline": "philo",
    "title": "Metafizik",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Var olmak, özdeşlik ve nedensellik üzerine.",
    "explanation": "Metafizik soruda kullanılan varlık, özellik, değişim ve özdeşlik terimlerini tanımla. Gündelik sözcüğün farklı tartışmalarda aynı anlama geldiğini varsayma.",
    "worked_example": {
      "text": "Kurgusal örnek: Bütün parçaları değişen bir nesneye aynı nesne diyoruz. Aynılık ölçütü ad mı, madde mi, süreklilik mi?",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Ölçüt belirtmeden aynı/farklı hükmü vermek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte tartışmayı ilerletmek için neyi açık yazmalısın?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte tartışmayı ilerletmek için neyi açık yazmalısın?",
      "expected_answer": "Özdeşlik ölçütünü ve bu ölçütle hangi değişimlerin kabul edildiğini."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; ölçüt belirtmeden aynı/farklı hükmü vermek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Töz ve nitelik",
      "Özdeşlik ve süreklilik",
      "Nedensellik",
      "Özgür irade ve determinizm",
      "Zamanın doğası"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-siyaset",
    "esp_topic_id": "p-siyaset",
    "discipline": "philo",
    "title": "Siyaset felsefesi",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "İktidarın meşruiyetini ve adaleti tartışmak.",
    "explanation": "Siyaset felsefesinde özgürlük, adalet ve meşruiyet için kullanılan ölçütleri ayrı açıkla. Bir politik tercihi kavramın tek mümkün tanımı sayma.",
    "worked_example": {
      "text": "Kurgusal durum: Herkese eşit kaynak mı, ihtiyaca göre farklı kaynak mı? Eşitlik ölçütünü yazmadan kıyas yapılamaz.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Dağıtım sonucuyla gerekçesini karıştırmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "İki önerinin hangi temel ölçütü farklı?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "İki önerinin hangi temel ölçütü farklı?",
      "expected_answer": "Kaynak eşitliği ile ihtiyaç temelli dağıtım ölçütü."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; dağıtım sonucuyla gerekçesini karıştırmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Toplum sözleşmesi",
      "Adalet kuramları",
      "Özgürlük kavramları",
      "Devletin sınırları",
      "Eşitlik ve hak"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-islam",
    "esp_topic_id": "p-islam",
    "discipline": "philo",
    "title": "İslam felsefesi",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Akıl–vahiy ilişkisini kendi geleneğinde okumak.",
    "explanation": "Bir düşünce geleneğini tek görüş gibi temsil etme. İncelenen yazarın eseri, çevirisi, tarihi ve kavram kullanımı belirlenmeden genel doktrin atama.",
    "worked_example": {
      "text": "Araştırma görevi: İki farklı metinde akıl sözcüğünün geçtiği bölümleri bağlamıyla karşılaştır. Bu kurgusal yöntem örneği yazar alıntısı değildir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir yazarın cümlesini bütün geleneğin görüşü ilan etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bir görüşü geleneğe genellemeden önce hangi kaynak alanları gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bir görüşü geleneğe genellemeden önce hangi kaynak alanları gerekir?",
      "expected_answer": "Yazar, eser, bölüm, baskı/çeviri ve görüşün kapsamı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir yazarın cümlesini bütün geleneğin görüşü ilan etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Meşşâî gelenek (Fârâbî, İbn Sînâ)",
      "Gazâlî'nin eleştirisi",
      "İbn Rüşd'ün cevabı",
      "İbn Haldûn ve tarih bilimi",
      "Tasavvuf düşüncesi"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-alman",
    "esp_topic_id": "p-alman",
    "discipline": "philo",
    "title": "Alman idealizmi",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Kant sonrası düşüncenin kırılmasını izlemek.",
    "explanation": "Alman idealizmini çalışırken yazarın sorununu ve terimlerini özgün metin bağlamında ayır. İkinci el özetleri birincil metin alıntısı gibi sunma.",
    "worked_example": {
      "text": "Araştırma örneği: Öznenin bilgiye katkısı sorusunu iki yorumda karşılaştır; hangi yorumun hangi bölüme dayandığını yaz.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir kavramı çağdaş gündelik karşılığıyla aynı kabul etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Özetin doğrulanabilir olması için hangi bağlantı gerekli?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Özetin doğrulanabilir olması için hangi bağlantı gerekli?",
      "expected_answer": "Yorum ile dayandığı yazar/eser/bölüm arasında izlenebilir bağ."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir kavramı çağdaş gündelik karşılığıyla aynı kabul etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Kant: eleştiri projesi",
      "Fichte ve ben",
      "Hegel: diyalektik",
      "Schopenhauer: istenç",
      "Marx: tersine çevirme"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-varolus",
    "esp_topic_id": "p-varolus",
    "discipline": "philo",
    "title": "Varoluşçuluk ve fenomenoloji",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Özne, kaygı ve anlam sorusunu ele almak.",
    "explanation": "Deneyim betimlemesi, deneyime dair neden açıklaması ve değer yargısı ayrı işlemlerdir. Fenomenoloji ve varoluşçuluk etiketlerini tek okul gibi eritme.",
    "worked_example": {
      "text": "Kurgusal örnek: Bir odanın dar hissedilmesini betimlemek, neden dar hissettiğini psikolojik olarak açıklamakla aynı görev değildir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Betimleme tamamlanmadan neden kesinleştirmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte iki ayrı soru nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte iki ayrı soru nedir?",
      "expected_answer": "Deneyimin nasıl göründüğü ve bu deneyimin neden oluştuğu."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; betimleme tamamlanmadan neden kesinleştirmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Kierkegaard ve iman",
      "Nietzsche: değerlerin yeniden değerlendirilmesi",
      "Husserl: yönelmişlik",
      "Heidegger: Dasein",
      "Sartre ve Camus"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-analitik",
    "esp_topic_id": "p-analitik",
    "discipline": "philo",
    "title": "Analitik felsefe",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Dil çözümlemesi yoluyla felsefi sorunları ele almak.",
    "explanation": "Analitik çözümlemede bir iddianın terimlerini, kapsamını ve mantıksal ilişkilerini açık hale getir. Her felsefi anlaşmazlığı yalnız kelime sorunu sayma.",
    "worked_example": {
      "text": "Kurgusal iddia: Her başarılı metin kısa olmalıdır. Başarılı ve kısa için ölçüt seç, olası karşı örneği tanımla.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Tanım değiştirerek karşı örneği görünmez kılmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Karşı örneği tartışabilmek için hangi iki tanım gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Karşı örneği tartışabilmek için hangi iki tanım gerekir?",
      "expected_answer": "Başarı ölçütü ve kısalık ölçütü."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; tanım değiştirerek karşı örneği görünmez kılmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Frege ve anlam–gönderim",
      "Russell: betimlemeler",
      "Wittgenstein: erken ve geç",
      "Mantıkçı pozitivizm ve eleştirisi",
      "Quine: iki dogma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-zihin",
    "esp_topic_id": "p-zihin",
    "discipline": "philo",
    "title": "Zihin felsefesi",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Zihin–beden sorununu ve bilinç tartışmasını kurmak.",
    "explanation": "Davranışın gözlenmesiyle kişinin deneyimine dair yorum farklı bilgi türleridir. Zihin felsefesi sorusunu tek davranış ölçümüne indirgeme.",
    "worked_example": {
      "text": "Kurgusal örnek: Bir cihaz doğru yanıt üretiyor. Buradan deneyim yaşadığı sonucuna geçmek ek gerekçe ister.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Başarılı çıktı ile bilinç konusunda kesin sonuç üretmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte gözlem ile ek yorum hangileridir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte gözlem ile ek yorum hangileridir?",
      "expected_answer": "Doğru yanıt gözlem; deneyim/bilinç atfı ek yorumdur."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; başarılı çıktı ile bilinç konusunda kesin sonuç üretmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "İkicilik ve fizikalizm",
      "İşlevselcilik",
      "Nitel deneyim (qualia)",
      "Yapay zihin tartışması",
      "Kişi özdeşliği"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-bilim",
    "esp_topic_id": "p-bilim",
    "discipline": "philo",
    "title": "Bilim felsefesi",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Bilimi bilim yapan şeyi tartışmak.",
    "explanation": "Bilimsel yöntem incelemesinde hipotez, gözlem, model ve açıklama birbirinin yerine geçmez. Yöntem etiketi tüm alanlar için tek değişmez reçete değildir.",
    "worked_example": {
      "text": "Kurgusal örnek: Çalışma süresi artarken başarı da artıyor. Diğer etkenler değiştiyse yalnız bu ilişkiden neden belirlenmez.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Birlikte değişimi nedensellik kanıtı saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte hangi ek değerlendirme gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte hangi ek değerlendirme gerekir?",
      "expected_answer": "Alternatif açıklamalar, ölçüm koşulları ve karşılaştırma tasarımı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; birlikte değişimi nedensellik kanıtı saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Yanlışlanabilirlik (Popper)",
      "Paradigma ve devrim (Kuhn)",
      "Araştırma programları (Lakatos)",
      "Bilimsel gerçekçilik",
      "Nedensellik ve açıklama"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-p-turk",
    "esp_topic_id": "p-turk",
    "discipline": "philo",
    "title": "Türk düşüncesi",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Kendi düşünce geleneğini kaynağından okumak.",
    "explanation": "Türk düşüncesini dönem, metin türü ve tartışma bağlamıyla incele. Bugünkü etiketleri geçmiş yazara geriye doğru kesin atama.",
    "worked_example": {
      "text": "Araştırma örneği: Aynı terimin iki dönemde kullanımını özgün bağlamlarıyla karşılaştır; çeviri ve sadeleştirme etkisini ayrı not et.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Sonraki dönemin kavramını önceki metinde aynı anlamda varsaymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Karşılaştırmada hangi iki dilsel kaynak farkı görünür olmalı?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Karşılaştırmada hangi iki dilsel kaynak farkı görünür olmalı?",
      "expected_answer": "Özgün dönem kullanımı ile çeviri/sadeleştirme tercihi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; sonraki dönemin kavramını önceki metinde aynı anlamda varsaymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "sep-logic"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Tanzimat sonrası fikir akımları",
      "Batılılaşma tartışması",
      "Cumhuriyet dönemi düşüncesi",
      "Çağdaş Türk felsefesi"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-temel",
    "esp_topic_id": "m-temel",
    "discipline": "music",
    "title": "Duruş, akort, ilk sesler",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Enstrümanı doğru tutmak ve temiz tek ses çıkarmak.",
    "explanation": "Duruş, akort ve nota adı farklı kontrol alanlarıdır. Doğru perdeye basıldığı gözlemi tek başına çalım konforunu veya akordu doğrulamaz.",
    "worked_example": {
      "text": "Kurgusal kayıt: Bir ses akort cihazında doğru görünür; eşlik eden tel hâlâ farklı akorttadır. Teller ayrı kontrol edilir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Tek bir doğru sesle bütün çalgının akortlu sayılması.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bir telde doğru gösterge bütün çalgı için neyi kanıtlamaz?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bir telde doğru gösterge bütün çalgı için neyi kanıtlamaz?",
      "expected_answer": "Diğer tellerin akordunu ve çalım tekniğini kanıtlamaz."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; tek bir doğru sesle bütün çalgının akortlu sayılması.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Oturuş ve el pozisyonu",
      "Akort (kulak ve alet ile)",
      "Tel–perde haritası",
      "Tabulatür ve nota okumanın farkı",
      "Pena tutuşu ve vuruş yönü"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-acik",
    "esp_topic_id": "m-acik",
    "discipline": "music",
    "title": "Açık akorlar ve ritim",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Sekiz açık akorla şarkı boyunca durmadan çalmak.",
    "explanation": "Akor şekliyle ritim devamlılığını ayrı çalış. Parmakların doğru yerde olması, bütün seslerin temiz çıktığını veya zamanlamanın korunduğunu göstermez.",
    "worked_example": {
      "text": "Kurgusal kayıt: Akor değişiminde duraklama var ama her akor ayrı çalındığında temiz. Sorun alanları ayrı gösterilir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Akor bilgisiyle geçiş sürekliliğini aynı beceri saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte hangi beceriler ayrı izlenir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte hangi beceriler ayrı izlenir?",
      "expected_answer": "Akorun ses temizliği ve akorlar arası ritmik geçiş."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; akor bilgisiyle geçiş sürekliliğini aynı beceri saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Em, Am, C, G, D, E, A, Dm",
      "Akor geçişinde ölü zaman",
      "Vuruş kalıpları (downstroke/upstroke)",
      "Metronomla dörtlük ve sekizlik",
      "Susturma (palm mute) ve dinamik"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-barre",
    "esp_topic_id": "m-barre",
    "discipline": "music",
    "title": "Barre ve CAGED",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Aynı akoru klavyenin beş yerinde kurmak.",
    "explanation": "Barre ve CAGED konularında şekil, kök ses ve pozisyon ilişkisini görünür yap. Bir şekli taşımak akorun adını her pozisyonda aynı bırakmaz.",
    "worked_example": {
      "text": "Kurgusal örnek: Aynı hareketli şekil başka perdeye taşınıyor. Kök ses konumu değiştiği için ad ayrıca kontrol edilir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Şekil ezberini armoni bilgisinin tamamı saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bir şekil taşındığında hangi bilgi tekrar belirlenmeli?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bir şekil taşındığında hangi bilgi tekrar belirlenmeli?",
      "expected_answer": "Yeni kök ses ve oluşan akorun adı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; şekil ezberini armoni bilgisinin tamamı saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "E ve A şekilli barre",
      "CAGED beş şekli",
      "Şekiller arası bağlama",
      "Kök sesi bulma",
      "Dayanıklılık çalışması"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-teori",
    "esp_topic_id": "m-teori",
    "discipline": "music",
    "title": "Temel teori",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Ne çaldığını adlandırabilmek.",
    "explanation": "Nota adı, ses yüksekliği ve ritmik değer ayrı kavramlardır. Müzik yazımında isim ile süreyi aynı etiket altında tutma.",
    "worked_example": {
      "text": "Özgün örnek: Do sesi farklı oktavlarda veya farklı sürelerle yazılabilir. İsim tek başına oktav/süreyi belirtmez.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Aynı nota adını aynı frekans ve süre sanmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Do sözcüğü hangi bilgileri tek başına vermez?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Do sözcüğü hangi bilgileri tek başına vermez?",
      "expected_answer": "Oktavı, mutlak frekansı ve ritmik süreyi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; aynı nota adını aynı frekans ve süre sanmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Tam ses–yarım ses",
      "Majör gam formülü",
      "Donanım ve beşliler çemberi",
      "Akor kuruluşu (üçlü, yedili)",
      "Derece ve fonksiyon (I–IV–V)"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-gam",
    "esp_topic_id": "m-gam",
    "discipline": "music",
    "title": "Gam ve pozisyon",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Beş pentatonik kalıbı ve majör gamı klavyede bağlamak.",
    "explanation": "Gamı yalnız perde şekli olarak ezberleme; başlangıç sesiyle adım örüntüsünü ilişkilendir. Sayısal perde sınıfı ile doğru nota yazımı ayrı tutulur.",
    "worked_example": {
      "text": "Do majörde C–D–E–F–G–A–B; F majörde B yerine B bemol gerekir. F majörü A diyez yazımıyla otomatik öğretme.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Enharmonik ses eşliğini her tonal yazımda aynı ad kabul etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "F majörde dördüncü derece hangi adla yazılır?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "F majörde dördüncü derece hangi adla yazılır?",
      "expected_answer": "B bemol; her harf adı sırayla kullanılır."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; enharmonik ses eşliğini her tonal yazımda aynı ad kabul etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Pentatonik beş kalıp",
      "Majör ve doğal minör",
      "Pozisyon değiştirme",
      "Modlar (Dorian, Mixolydian…)",
      "Gamı müzikal cümleye çevirme"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-teknik",
    "esp_topic_id": "m-teknik",
    "discipline": "music",
    "title": "Teknik dağarcık",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Sağ ve sol el tekniklerini temiz uygulamak.",
    "explanation": "Teknik dağarcıkta hedef ses, hareket ve zamanlama ayrı değerlendirilir. Bir tekniğin adını öğrenmek uygulamayı onaylamaz.",
    "worked_example": {
      "text": "Kurgusal örnek: Hammer-on denemesinde ses oluşuyor, fakat zamanlamada gecikme var. Ses ve zamanlama ayrı gözlenir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Ses duyulunca tekniğin bütün ölçütlerinin geçtiğini varsaymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte iki ayrı gözlem nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte iki ayrı gözlem nedir?",
      "expected_answer": "Sesin oluşması ve ritmik yerleşimi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; ses duyulunca tekniğin bütün ölçütlerinin geçtiğini varsaymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Hammer-on ve pull-off",
      "Slide ve bend (entonasyon!)",
      "Vibrato",
      "Fingerstyle ve arpej",
      "Alternate picking ve ekonomi"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-kulak",
    "esp_topic_id": "m-kulak",
    "discipline": "music",
    "title": "Kulak eğitimi",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Duyduğunu adlandırmak ve yazmak.",
    "explanation": "Kulak görevinde duyma, adlandırma ve yeniden üretme ayrı çıktılardır. Rastlantısal doğru yanıtla kalıcı ayırt etme becerisini eşitleme.",
    "worked_example": {
      "text": "Kurgusal görev: Aralığı iki seçenekten seçmek ile aynı aralığı söylemek farklı değerlendirmelerdir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Çoktan seçmeli sonuçtan otomatik ses üretim yeterliği çıkarmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Seçme görevindeki başarı hangi görevi tek başına doğrulamaz?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Seçme görevindeki başarı hangi görevi tek başına doğrulamaz?",
      "expected_answer": "Aralığı sesle veya çalgıyla yeniden üretmeyi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; çoktan seçmeli sonuçtan otomatik ses üretim yeterliği çıkarmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Aralık tanıma",
      "Akor türü ayırt etme",
      "Derece duyma",
      "Ritim yazımı",
      "Melodi yazımı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-dogac",
    "esp_topic_id": "m-dogac",
    "discipline": "music",
    "title": "Doğaçlama",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Bir akor dizisi üzerine anlamlı cümle kurmak.",
    "explanation": "Doğaçlamada seçilen sesler, ritmik yapı ve eşlik bağlamı birlikte açıklanır. Gam listesine uygun olmak müzikal cümlenin tüm niteliğini ölçmez.",
    "worked_example": {
      "text": "Kurgusal örnek: Bütün notalar seçilen gamda, ama cümlede durak/tekrar kararı açıklanmıyor. Bağlam ayrıca tartışılır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Gam dışı sesi her bağlamda otomatik hata saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Gam üyeliği dışında hangi kararları açıklayabilirsin?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Gam üyeliği dışında hangi kararları açıklayabilirsin?",
      "expected_answer": "Ritim, vurgu, cümle sonu ve eşliğe ilişkin seçimleri."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; gam dışı sesi her bağlamda otomatik hata saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Hedef ses (chord tone) yaklaşımı",
      "Motif geliştirme",
      "Soru–cevap kurgusu",
      "Dinamik ve boşluk kullanımı",
      "Blues formu üzerinde uygulama"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-m-repertuar",
    "esp_topic_id": "m-repertuar",
    "discipline": "music",
    "title": "Repertuar ve sahne",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Baştan sona çalınabilir bir set kurmak ve korumak.",
    "explanation": "Repertuarda bölüm çalışması, bütün eserin icrası ve sunum koşulu ayrı aşamalardır. Bir pasajın doğru çalınması tüm eserin hazır olduğunu göstermez.",
    "worked_example": {
      "text": "Kurgusal kayıt: Başlangıç bölümü rahat çalınıyor; ortadaki geçiş henüz kaydedilmedi. Eserin bütünü için veri eksik.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Çalışılmış bölümden tüm esere hazırlık garantisi vermek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte bütün eser için hangi gözlem eksik?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte bütün eser için hangi gözlem eksik?",
      "expected_answer": "Çalışılmamış geçişler ve kesintisiz bütün icra kaydı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; çalışılmış bölümden tüm esere hazırlık garantisi vermek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Parça seçimi ve zorluk dengesi",
      "Ezber stratejisi",
      "Bakım planı (çalınmayan parça geri gider)",
      "Kayıt alma ve dinleme",
      "Sahne provası"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-nefes",
    "esp_topic_id": "d-nefes",
    "discipline": "diction",
    "title": "Nefes ve diyafram",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Cümle sonuna nefesi yetirerek konuşmak.",
    "explanation": "Nefes çalışmasını süre yarışı veya sağlık tedavisi gibi ele alma. Konuşma görevi, rahatlık ve ses kullanımı bağlamı birlikte değerlendirilir.",
    "worked_example": {
      "text": "Kurgusal kayıt: Bir kişi cümleyi daha uzun söylüyor ama zorlanma belirtiyor. Uzunluk tek başarı ölçütü değildir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Nefes tutma süresinden konuşma sağlığı veya yetenek sonucu çıkarmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu kayıtta uzunluğun yanında hangi bilgi önemlidir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu kayıtta uzunluğun yanında hangi bilgi önemlidir?",
      "expected_answer": "Rahatlık, zorlanma ve konuşma bağlamı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; nefes tutma süresinden konuşma sağlığı veya yetenek sonucu çıkarmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Diyafram nefesi",
      "Nefes destekli ses",
      "Cümle içinde nefes yeri seçme",
      "Nefes egzersizleri (4-7-8)"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-ses",
    "esp_topic_id": "d-ses",
    "discipline": "diction",
    "title": "Ses ve rezonans",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Bağırmadan duyulur olmak.",
    "explanation": "Ses yüksekliği, perde ve algılanan tını ayrı özelliklerdir. Bir kaydın parlak veya güçlü duyulması mikrofon koşulundan etkilenebilir.",
    "worked_example": {
      "text": "Kurgusal çift: Aynı konuşma iki farklı mikrofon mesafesinde kaydediliyor. Ses şiddeti farkı teknik gelişimi tek başına göstermez.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Cihaz farkını doğrudan ses gelişimi saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Karşılaştırmada hangi koşullar aynı tutulmalı?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Karşılaştırmada hangi koşullar aynı tutulmalı?",
      "expected_answer": "Mikrofon, mesafe, ortam ve kayıt düzeyi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; cihaz farkını doğrudan ses gelişimi saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Göğüs ve kafa rezonansı",
      "Ses ısınması",
      "Ses hijyeni (su, uyku, yorgunluk)",
      "Perde (pitch) genişliği"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-bogumlama",
    "esp_topic_id": "d-bogumlama",
    "discipline": "diction",
    "title": "Boğumlanma (artikülasyon)",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Ünlü ve ünsüzleri eksiksiz çıkarmak.",
    "explanation": "Boğumlanma görevinde hedef ses ve hata türünü seç. Daha hızlı tekerleme, anlaşılabilirliğin otomatik arttığı anlamına gelmez.",
    "worked_example": {
      "text": "Özgün cümle: Kırmızı kalem küçük kutuda. Hedef sesleri işaretleyip kayıtla karşılaştır; klinik değerlendirme değildir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Hız artışını artikülasyon doğruluğu yerine kullanmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu görevde hız ve doğru ses üretimi nasıl kaydedilir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu görevde hız ve doğru ses üretimi nasıl kaydedilir?",
      "expected_answer": "Ayrı alanlarda; hata tanımı ve kayıt koşullarıyla."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; hız artışını artikülasyon doğruluğu yerine kullanmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Ünlülerin çıkış yerleri",
      "Zor ünsüz çiftleri",
      "Kelime sonu düşmesi",
      "Tekerleme çalışması",
      "Abartılı söyleyip normale dönme"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-vurgu",
    "esp_topic_id": "d-vurgu",
    "discipline": "diction",
    "title": "Vurgu",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Kelime ve cümle vurgusunu doğru yere koymak.",
    "explanation": "Vurgu cümlede hangi bilginin öne çıktığını etkileyebilir. Tek cümle için bütün bağlamlarda geçerli tek vurgu dayatma.",
    "worked_example": {
      "text": "Özgün cümle: Ben bugün geldim. Ben, bugün veya geldim üzerinde vurgu farklı karşılaştırma bağlamlarına uygun olabilir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bağlam belirtilmeden tek vurguyu tek doğru saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Vurgu seçimini anlamak için hangi soru gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Vurgu seçimini anlamak için hangi soru gerekir?",
      "expected_answer": "Konuşmada hangi bilginin karşılaştırıldığı veya düzeltildiği."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bağlam belirtilmeden tek vurguyu tek doğru saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Türkçede kelime vurgusu (genelde son hece)",
      "Yer adlarında vurgu istisnaları",
      "Yabancı kökenli kelimelerde vurgu",
      "Cümle vurgusuyla anlam değiştirme"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-ulama",
    "esp_topic_id": "d-ulama",
    "discipline": "diction",
    "title": "Ulama ve durak",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Akıcılığı kuralla kurmak, hızla değil.",
    "explanation": "Ulama ve durak için yazıdaki sınırla konuşmadaki sınırı ayrı düşün. Noktalama işareti otomatik sabit saniyelik sessizlik değildir.",
    "worked_example": {
      "text": "Özgün cümle: Eğer yetişirsem, toplantıya katılırım. Koşul ve sonuç ilişkisini anlamıyla seslendir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Her virgüle aynı süre durak atamak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte durak kararının hangi anlam ilişkisini koruması gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte durak kararının hangi anlam ilişkisini koruması gerekir?",
      "expected_answer": "Koşul cümlesiyle sonuç cümlesinin ilişkisini."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; her virgüle aynı süre durak atamak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Ulama kuralı ve istisnaları",
      "Durak yerleri",
      "Noktalamanın sesteki karşılığı",
      "Tonlama eğrisi (soru, ünlem)"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-hiz",
    "esp_topic_id": "d-hiz",
    "discipline": "diction",
    "title": "Tempo ve ritim",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Dinleyicinin izleyebileceği hızda konuşmak.",
    "explanation": "Konuşma hızını kullanılan kelime sayım yöntemi ve fiili süreyle hesapla. Duraklı ve duraksız kayıt aynı süre temelini kullanmayabilir.",
    "worked_example": {
      "text": "Kurgusal örnek: 120 kelimeyi 60 saniyede okumak 120 kelime/dakikadır; bu tek başına anlaşılabilirlik puanı değildir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Herkes için tek ideal hız veya başarı eşiği ilan etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "120 kelime/dakika hangi niteliği doğrudan ölçmez?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "120 kelime/dakika hangi niteliği doğrudan ölçmez?",
      "expected_answer": "Anlaşılabilirlik, anlam aktarımı ve dinleyiciye uygunluğu."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; herkes için tek ideal hız veya başarı eşiği ilan etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Kelime/dakika ölçümü",
      "Hız değiştirerek vurgulama",
      "Dolgu sesleri (ıı, şey) azaltma",
      "Sessizliği kullanma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-retorik",
    "esp_topic_id": "d-retorik",
    "discipline": "diction",
    "title": "Retoriğin beş kanonu",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Konuşmayı hazırlamaktan sunmaya kadar sistemli çalışmak.",
    "explanation": "Hitabet hazırlığında içerik bulma, düzenleme ve sunumu ayrı çalış. İyi seslendirme yetersiz gerekçeyi tamamlamaz.",
    "worked_example": {
      "text": "Kurgusal sunum: Güçlü giriş var ama iddiayı destekleyen veri yok. Ses tonu yerine gerekçe eksikliği belirlenir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Sunum etkisini iddianın doğruluğu sanmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu sunumda öncelikli içerik eksiği nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu sunumda öncelikli içerik eksiği nedir?",
      "expected_answer": "İddiayı destekleyen gerekçe veya kanıt."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; sunum etkisini iddianın doğruluğu sanmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Inventio — ne söyleneceğinin bulunması",
      "Dispositio — malzemenin sıraya konması",
      "Elocutio — üslup ve söz sanatları",
      "Memoria — içselleştirme ve bellek",
      "Pronuntiatio — ses ve bedenle sunum"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-sunum",
    "esp_topic_id": "d-sunum",
    "discipline": "diction",
    "title": "Sunum ve dinleyici",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Dinleyiciyle bağ kurarak konuşmak.",
    "explanation": "Sunum hedefi, dinleyicinin ön bilgisi ve kullanılabilir bağlam belirlenir. Aynı metin farklı dinleyici grubunda farklı açıklama ihtiyacı doğurabilir.",
    "worked_example": {
      "text": "Kurgusal örnek: Teknik terim uzman grupta açıklanmazken yeni başlayan dinleyici için tanım gerekir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Dinleyicinin anlamasını yalnız konuşmacının akıcılığıyla değerlendirmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Hedef kitle değişince hangi içerik kararı gözden geçirilir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Hedef kitle değişince hangi içerik kararı gözden geçirilir?",
      "expected_answer": "Terim açıklaması, örnek seçimi ve ön bilgi varsayımı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; dinleyicinin anlamasını yalnız konuşmacının akıcılığıyla değerlendirmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Açılış ve kapanış kurgusu",
      "Göz teması ve duruş",
      "Soru–cevap yönetimi",
      "Zor soruya cevap kalıpları",
      "Heyecanı yönetme"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-d-okuma",
    "esp_topic_id": "d-okuma",
    "discipline": "diction",
    "title": "Metin seslendirme",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Yazılı metni doğal duyulacak biçimde okumak.",
    "explanation": "Metin seslendirmede anlatıcı konumu, anlam birimleri ve vurgu seçenekleri tartışılır. Estetik yorum tek otomatik puanla kesinleştirilmez.",
    "worked_example": {
      "text": "Özgün cümle: Kapı açıldı; kimse konuşmadı. İki farklı tonlama seç ve anlam etkisini gerekçelendir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Farklı yorumları ölçüt olmadan yanlış saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Yorumunu hangi öğelerle gerekçelendirebilirsin?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Yorumunu hangi öğelerle gerekçelendirebilirsin?",
      "expected_answer": "Metindeki anlam, anlatıcı bağlamı, durak ve vurgu seçimleri."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; farklı yorumları ölçüt olmadan yanlış saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "nidcd"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Metni işaretleme (vurgu, durak)",
      "Anlatıcı tonu",
      "Diyalog seslendirme",
      "Mikrofon mesafesi ve patlayıcı sesler"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-duzey",
    "esp_topic_id": "r-duzey",
    "discipline": "reading",
    "title": "Dört okuma düzeyi",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Hangi düzeyde okuduğunu bilerek okumak.",
    "explanation": "Okuma düzeyini amaç seçimi için kullan. Bir çerçevenin adı çalışmanın çıktısını veya kişinin becerisini tek başına ölçmez.",
    "worked_example": {
      "text": "Kurgusal görev: Kitabın konusu hakkında yön bulmak ile savını çözümlemek farklı okuma amaçlarıdır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir düzey etiketini resmî yeterlilik kabul etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu iki amaç için beklenen çıktılar nasıl farklıdır?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu iki amaç için beklenen çıktılar nasıl farklıdır?",
      "expected_answer": "İlkinde konu/yapı özeti; ikincisinde tez, gerekçe ve kavram çözümlemesi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir düzey etiketini resmî yeterlilik kabul etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Temel okuma",
      "Gözden geçirme (inceleme)",
      "Analitik okuma",
      "Sentopik okuma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-gozden",
    "esp_topic_id": "r-gozden",
    "discipline": "reading",
    "title": "Gözden geçirme tekniği",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "On beş dakikada kitabın ne olduğunu anlamak.",
    "explanation": "Gözden geçirme, metnin yapısı ve amacına ilişkin ilk haritayı oluşturur. Başlıkların okunması bütün savın anlaşılması değildir.",
    "worked_example": {
      "text": "Kurgusal kitapta içindekilerde üç bölüm var; her bölümün işlevine dair geçici soru yaz.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Gözden geçirme notunu tamamlanmış içerik özeti gibi sunmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu aşamada hangi etiket uygun?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu aşamada hangi etiket uygun?",
      "expected_answer": "Geçici yapı/amaç tahmini; ayrıntılı okuma bekliyor."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; gözden geçirme notunu tamamlanmış içerik özeti gibi sunmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Kapak, içindekiler, dizin",
      "Giriş ve sonuç okuması",
      "Rastgele paragraf örneklemesi",
      "Bırakma kararı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-not",
    "esp_topic_id": "r-not",
    "discipline": "reading",
    "title": "Atomik not",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Tek fikir taşıyan, kendi cümlenle yazılmış not üretmek.",
    "explanation": "Atomik not bir düşünceyi kendi ifadene çevirip kaynak konumuyla ilişkilendirir. Kısalık tek başına açıklık veya doğruluk değildir.",
    "worked_example": {
      "text": "Kurgusal not: Yazar X sonucu savunuyor, çünkü Y; bölüm 2. Not iddiayı, gerekçeyi ve konumu ayrı tutuyor.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Kaynağın yargısıyla kendi yorumunu aynı alana yazmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu notta hangi üç öğe ayırt ediliyor?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu notta hangi üç öğe ayırt ediliyor?",
      "expected_answer": "İddia, gerekçe ve kaynak konumu."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; kaynağın yargısıyla kendi yorumunu aynı alana yazmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Tek not = tek fikir",
      "Kendi cümlenle yazma",
      "Kavram etiketi",
      "Alıntı ile not arasındaki fark"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-analitik",
    "esp_topic_id": "r-analitik",
    "discipline": "reading",
    "title": "Analitik okumanın soruları",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Bir kitabı bitirdikten sonra dört soruyu cevaplayabilmek.",
    "explanation": "Analitik okumada tez, destek, kavram ve kapsam ayrı sorulardır. Yazarın ne dediğini anlamak onu onaylamakla aynı değildir.",
    "worked_example": {
      "text": "Kurgusal metin: Bir uygulamanın erişimi artıracağı savunuluyor; veri yalnız tek gruptan. Tez ile genelleme sınırını ayır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Eleştiriden önce savı eksik veya zayıf temsil etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte hangi sınır ayrıca not edilir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte hangi sınır ayrıca not edilir?",
      "expected_answer": "Verinin hangi gruptan geldiği ve hangi gruplara aktarılabileceği."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; eleştiriden önce savı eksik veya zayıf temsil etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Kitap ne hakkında?",
      "Ayrıntıda ne söyleniyor?",
      "Doğru mu, hangi kısmı?",
      "Ne olmuş yani?"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-bag",
    "esp_topic_id": "r-bag",
    "discipline": "reading",
    "title": "Bağ kurma",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Notları birbirine gerekçeyle bağlamak.",
    "explanation": "Kavram bağı iki notun hangi ilişkiyle bir araya geldiğini açıklar. Aynı kelimenin geçmesi yeterli ilişki kanıtı değildir.",
    "worked_example": {
      "text": "Kurgusal çift: Bir not ekonomik özgürlük, diğeri konuşma özgürlüğü üzerine. Bağ ortak kelime değil, tanımlanan kavram ilişkisidir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bütün özgürlük kullanımlarını aynı anlam saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bağlantı kaydında hangi alan gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bağlantı kaydında hangi alan gerekir?",
      "expected_answer": "İlişki türü ve iki bağlamdaki terim anlamları."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bütün özgürlük kullanımlarını aynı anlam saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Ortak kavram üzerinden bağ",
      "Çelişki bağı",
      "Bağın gerekçesini yazma",
      "Bağlanmamış not avı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-sentopik",
    "esp_topic_id": "r-sentopik",
    "discipline": "reading",
    "title": "Sentopik okuma",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Bir soruyu birden çok yazar üzerinden okumak.",
    "explanation": "Karşılaştırmalı okumada ortak soru seçip farklı metinlerin cevaplarını bu soruya göre düzenle. Aynı terim farklı yazarda farklı tanıma sahip olabilir.",
    "worked_example": {
      "text": "Kurgusal soru: Eğitimde adalet nedir? Bir metin erişimi, diğeri sonuç dağılımını öne çıkarıyor.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Yazarları aynı terimi kullandıkları için aynı görüşte saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu karşılaştırmada önce ne açıklaştırılır?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu karşılaştırmada önce ne açıklaştırılır?",
      "expected_answer": "Ortak soru ve her yazarın adalet ölçütü."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; yazarları aynı terimi kullandıkları için aynı görüşte saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Soruyu kitaptan önce kurma",
      "İlgili bölümleri bulma",
      "Yazarları ortak terime çevirme",
      "Soruları sıraya koyma",
      "Tarafsız kalma sorumluluğu"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-elestiri",
    "esp_topic_id": "r-elestiri",
    "discipline": "reading",
    "title": "Eleştirel okuma",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Anlamadan katılmamak, anlamadan karşı çıkmamak.",
    "explanation": "Eleştirel okuma iddianın gücünü, kaynak niteliğini ve alternatif açıklamaları inceler. Şüphe etmek her iddiayı otomatik reddetmek değildir.",
    "worked_example": {
      "text": "Kurgusal metin tek örnekten genel sonuç çıkarıyor. Örneğin kaynağını ve temsil ettiği kapsamı sorgula.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Eleştiriyi yalnız beğenmedim ifadesine indirgemek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "İtirazı gerekçeli yapmak için hangi sınır gösterilir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "İtirazı gerekçeli yapmak için hangi sınır gösterilir?",
      "expected_answer": "Kanıt örneğinin genelleme kapsamını destekleyip desteklemediği."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; eleştiriyi yalnız beğenmedim ifadesine indirgemek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Yazarı anlamadan yargılamamak",
      "Bilgi eksikliği iddiası",
      "Mantık hatası iddiası",
      "Eksik çözümleme iddiası"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-r-kanon",
    "esp_topic_id": "r-kanon",
    "discipline": "reading",
    "title": "Kendi kanonunu kurmak",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Okuma listesini rastlantıdan kurtarmak.",
    "explanation": "Kendi okuma listesini soru ve karşılaşmak istediğin bakış açılarıyla kur. Liste büyüklüğü anlayış veya kültürel üstünlük ölçümü değildir.",
    "worked_example": {
      "text": "Kurgusal liste aynı konu için bir giriş, bir birincil metin ve bir eleştiri içeriyor. Her birinin görevini yaz.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Yazar sayısını düşünsel başarı puanı saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Üç kaynak türünün ayrı işlevleri nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Üç kaynak türünün ayrı işlevleri nedir?",
      "expected_answer": "Yön bulma, özgün savı inceleme ve eleştirel karşılaştırma."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; yazar sayısını düşünsel başarı puanı saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Alan haritası çıkarma",
      "Birincil–ikincil dengesi",
      "Okuma sırası tasarımı",
      "Yeniden okuma planı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-cumle",
    "esp_topic_id": "w-cumle",
    "discipline": "writing",
    "title": "Cümle",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Tek bir işi yapan, okunur cümle kurmak.",
    "explanation": "Cümlede ana yüklem, ilişkili öğeler ve göndermeler açık olmalı. Daha kısa cümle her durumda daha açık veya daha iyi değildir.",
    "worked_example": {
      "text": "Özgün çift: Raporu müdüre verdim; o kayıptı. Kaybolanın rapor mu müdür mü olduğu belirsizdir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Kelime sayısını azaltırken anlam göndermesini belirsizleştirmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte o sözcüğünün hangi iki gönderimi mümkün?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte o sözcüğünün hangi iki gönderimi mümkün?",
      "expected_answer": "Rapor veya müdür; amaçlanan gönderim açık yazılmalıdır."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; kelime sayısını azaltırken anlam göndermesini belirsizleştirmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Özne–yüklem yakınlığı",
      "Cümle uzunluğu değişimi",
      "Edilgen yapının bedeli",
      "Gereksiz kelime avı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-paragraf",
    "esp_topic_id": "w-paragraf",
    "discipline": "writing",
    "title": "Paragraf",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Her paragrafa bir iş yaptırmak.",
    "explanation": "Paragrafın ana iddiası ile örnek ve açıklaması arasındaki bağı göster. Cümleler aynı konuda olsa da tek işlev taşımayabilir.",
    "worked_example": {
      "text": "Kurgusal paragrafta ulaşım ucuz olmalı savından birden parkların estetiğine geçiliyor; ilişki kurulmadıysa yeni paragraf veya geçiş gerekir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Her uzun paragrafı yalnız uzunluğu yüzünden kötü saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte sorun uzunluk mu, ilişki mi?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte sorun uzunluk mu, ilişki mi?",
      "expected_answer": "Açıklanmayan konu/işlev ilişkisi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; her uzun paragrafı yalnız uzunluğu yüzünden kötü saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Konu cümlesi",
      "Geçiş ifadeleri",
      "Paragraf uzunluğu",
      "Tek fikir kuralı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-yapi",
    "esp_topic_id": "w-yapi",
    "discipline": "writing",
    "title": "Metin yapısı",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Yazmadan önce iskelet kurmak.",
    "explanation": "Metin yapısı okuyucunun hangi soruyu hangi sırayla cevaplayacağını düzenler. Başlık eklemek mantıksal sıralamanın yerini tutmaz.",
    "worked_example": {
      "text": "Kurgusal metin sonucu başta ilan ediyor ama ölçütü sona bırakıyor. Okuyucunun değerlendirmesi için ölçüt görünür hale getirilebilir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Başlık sayısını düzen kalitesi ölçüsü saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Sonucun değerlendirilmesi için hangi öğe açık olmalı?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Sonucun değerlendirilmesi için hangi öğe açık olmalı?",
      "expected_answer": "Kullanılan ölçüt ve sonuca götüren gerekçe."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; başlık sayısını düzen kalitesi ölçüsü saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Tez–karşı tez–sentez",
      "Sorun–çözüm",
      "Anlatı yapısı",
      "Karşılaştırma",
      "Numaralı sav"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-iddia",
    "esp_topic_id": "w-iddia",
    "discipline": "writing",
    "title": "İddia ve kanıt",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Her iddianın arkasına bir şey koymak.",
    "explanation": "İddianın kapsamıyla kanıtın kapsamını birlikte kontrol et. Bir veri kümesi veya alıntı kendi başına sonucun bütününü desteklemez.",
    "worked_example": {
      "text": "Kurgusal veri yalnız bir okuldan; metin bütün öğrenciler için aynı sonucu ilan ediyor. Kapsam farkı gösterilir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Kaynak bağlantısını iddia doğrulandı rozeti saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte hangi kapsamlar uyuşmuyor?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte hangi kapsamlar uyuşmuyor?",
      "expected_answer": "Tek okul verisi ile tüm öğrenciler genellemesi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; kaynak bağlantısını iddia doğrulandı rozeti saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Tek cümlelik iddia",
      "Örnek, sayı, alıntı",
      "Kanıtın kaynağını verme",
      "Görüş ile olguyu ayırma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-revizyon",
    "esp_topic_id": "w-revizyon",
    "discipline": "writing",
    "title": "Revizyon",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Sıralı geçişlerle metni sağlamlaştırmak.",
    "explanation": "Revizyonda amaç, sav ve düzen kararlarıyla yazım düzeltmesini ayrı geçir. Yazım hatalarının temizlenmesi savı güçlendirmiş olmak değildir.",
    "worked_example": {
      "text": "Kurgusal taslakta tüm virgüller düzeltildi ama ana iddiayı destekleyen örnek hâlâ yok. İçerik revizyonu sürer.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Düzeltilmiş noktalama ile metnin tamamlandığını varsaymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu taslakta hangi tür revizyon eksik?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu taslakta hangi tür revizyon eksik?",
      "expected_answer": "Sav ve kanıt/örnek ilişkisine yönelik içerik revizyonu."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; düzeltilmiş noktalama ile metnin tamamlandığını varsaymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Yapı geçişi",
      "İddia geçişi",
      "Kanıt geçişi",
      "Kısaltma geçişi",
      "Cümle geçişi",
      "Tekrar geçişi",
      "Sesli okuma"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-uslup",
    "esp_topic_id": "w-uslup",
    "discipline": "writing",
    "title": "Üslup",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Aynı fikri farklı seslerde yazabilmek.",
    "explanation": "Üslup hedef okur, amaç ve söyleyiş tercihlerinin birlikte etkisidir. Tek okunabilirlik puanı bu seçimleri veya doğruluğu ölçmez.",
    "worked_example": {
      "text": "Özgün çift: Başvuru reddedildi. / Belgeler eksik olduğu için başvuru reddedildi. İkinci cümle daha uzun ama gerekçe ekliyor.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Kısaltmayı her koşulda üslup iyileştirmesi kabul etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "İkinci cümlenin eklediği işlev nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "İkinci cümlenin eklediği işlev nedir?",
      "expected_answer": "Red kararının gerekçesini açıklamak."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; kısaltmayı her koşulda üslup iyileştirmesi kabul etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Kayıt (resmî, günlük, akademik)",
      "Ritim ve uzunluk",
      "Somut ayrıntı",
      "Klişe avı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-retorik",
    "esp_topic_id": "w-retorik",
    "discipline": "writing",
    "title": "Söz sanatları",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Dilin araçlarını bilerek kullanmak.",
    "explanation": "Söz sanatı bir anlatım tercihidir; etkisi bağlam ve amaçla değerlendirilir. Mecazı olgusal iddia gibi okumak anlamı değiştirebilir.",
    "worked_example": {
      "text": "Özgün örnek: Şehir uyandı. Şehrin biyolojik canlı olduğu iddiası değil, hareketliliği anlatan bir tercih olabilir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Mecazı bağlam olmadan gerçek olay bildirimi saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte hangi iki okuma ayrılır?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte hangi iki okuma ayrılır?",
      "expected_answer": "Düz olgusal okuma ve mecazlı anlatım."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; mecazı bağlam olmadan gerçek olay bildirimi saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Üçleme ve karşıtlık",
      "Baş yinelemesi",
      "Benzetme ve eğretileme",
      "Sözde soru",
      "Eksiltme",
      "Dereceleme"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-tur",
    "esp_topic_id": "w-tur",
    "discipline": "writing",
    "title": "Türler",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Türün kendi kurallarına göre yazmak.",
    "explanation": "Türün okuyucuyla kurduğu beklenti taslak kararlarını değiştirir. Deneme, rapor ve anlatıda aynı gerekçe/sıralama ölçütleri otomatik uygulanmaz.",
    "worked_example": {
      "text": "Kurgusal çift: Bir kişisel anı ve bir araştırma raporu aynı olayı anlatıyor; kanıt sunma görevleri farklıdır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir türün ölçütünü bütün metinlere tek doğru saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Örnekte hangi görev farkı belirlenir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Örnekte hangi görev farkı belirlenir?",
      "expected_answer": "Kişisel deneyim aktarımı ile araştırma iddiasının kanıtlanması."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir türün ölçütünü bütün metinlere tek doğru saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Deneme",
      "Eleştiri",
      "Anlatı",
      "Teknik metin",
      "Mektup"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-w-uzun",
    "esp_topic_id": "w-uzun",
    "discipline": "writing",
    "title": "Uzun biçim",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Bölümlü bir metni bitirebilmek.",
    "explanation": "Uzun biçimde bölüm amaçları ve ana savın gelişimi birlikte izlenir. Daha çok kelime, daha derin çözümleme garantisi değildir.",
    "worked_example": {
      "text": "Kurgusal üç bölüm aynı örneği tekrar ediyor; ikinci bölüm yeni itirazı ele alırsa metnin görevi değişir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Yinelenen paragrafları yeni içerik saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Yeni bölümün katkısı hangi soruyla denetlenir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Yeni bölümün katkısı hangi soruyla denetlenir?",
      "expected_answer": "Bu bölüm ana sav için hangi yeni açıklama, kanıt veya itirazı getiriyor?"
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; yinelenen paragrafları yeni içerik saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "purdue"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Bölüm mimarisi",
      "Taslak yönetimi",
      "Kendi editörün olmak",
      "Bitirme disiplini"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-kronoloji",
    "esp_topic_id": "h-kronoloji",
    "discipline": "history",
    "title": "Kronoloji kurma",
    "content_depth": "basit",
    "esp_level_reference": 1,
    "cefr": null,
    "goal": "Olayları zamanda doğru yere koymak.",
    "explanation": "Tarih kaydında olay tarihi, belge tarihi, kullanılan takvim ve yaklaşık olma durumu ayrı tutulur. Sıralama tek başına neden açıklaması değildir.",
    "worked_example": {
      "text": "Kurgusal belge 1910 tarihli, anlattığı olay 1908. Belgeyi olayın yerine 1910 çizgisine koymak farklı şeyi gösterir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Belge tarihiyle olay tarihini karıştırmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte zaman çizgisinde hangi iki tarih alanı gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte zaman çizgisinde hangi iki tarih alanı gerekir?",
      "expected_answer": "1908 olay tarihi ve 1910 belge tarihi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; belge tarihiyle olay tarihini karıştırmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Yüzyıl hesabı ve MÖ/MS",
      "Dönem sınırları ve tartışmalılığı",
      "Eşzamanlılık (aynı anda başka yerde)",
      "Uzun süre ve kısa olay"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-neden",
    "esp_topic_id": "h-neden",
    "discipline": "history",
    "title": "Nedensellik",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Kıvılcımı neden sanmamak.",
    "explanation": "Nedensellikte önce gelme, koşul sağlama ve doğrudan mekanizma farklı ilişkilerdir. Sonraki her olay öncekinin sonucu değildir.",
    "worked_example": {
      "text": "Kurgusal örnek: Bir düzenleme sonrası göç artıyor; aynı dönemde savaş ve fiyat değişimi de var. Alternatifler araştırılır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Önce/sonra sırasını tek başına nedensel kanıt saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte ne tür ek çalışma gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte ne tür ek çalışma gerekir?",
      "expected_answer": "Mekanizma ve alternatif açıklamaları kaynaklarla karşılaştırmak."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; önce/sonra sırasını tek başına nedensel kanıt saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Yapısal koşul",
      "Kurumsal neden",
      "Konjonktür",
      "Tetikleyici",
      "Fail kararı",
      "Tesadüf"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-kaynak",
    "esp_topic_id": "h-kaynak",
    "discipline": "history",
    "title": "Kaynak eleştirisi",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Bir bilginin nereden geldiğini sormak.",
    "explanation": "Kaynağın üreticisi, amacı, muhatabı ve korunma/aktarılma biçimini değerlendir. Birincil kaynak etiketi doğruluk garantisi değildir.",
    "worked_example": {
      "text": "Kurgusal iki belge: Resmî rapor ve özel mektup aynı olayı farklı seçmelerle anlatıyor. Amaç ve konum birlikte incelenir.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bir belge döneme ait diye bütün içeriğini doğru kabul etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Birincil kaynakta hangi bağlam soruları sorulur?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Birincil kaynakta hangi bağlam soruları sorulur?",
      "expected_answer": "Kim, ne zaman, kime, hangi amaçla ve hangi aktarım yoluyla üretti?"
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bir belge döneme ait diye bütün içeriğini doğru kabul etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Birincil–ikincil–üçüncül",
      "Yazarın konumu ve çıkarı",
      "İç ve dış tutarlılık",
      "Suskunluk sorunu",
      "Çeviri ve yorum"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-yazim",
    "esp_topic_id": "h-yazim",
    "discipline": "history",
    "title": "Tarih yazımı okulları",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Aynı olayın farklı anlatılarını tanımak.",
    "explanation": "Tarih yazımı yaklaşımı hangi soruların ve kaynakların öne çıkarıldığını etkileyebilir. Bir okulun adını öğrenmek metnin yorumunu çözümlemek değildir.",
    "worked_example": {
      "text": "Kurgusal iki anlatı aynı dönemde birinde kurumları, diğerinde gündelik yaşamı öne çıkarıyor. Soru ve kaynak farkını göster.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Farklı vurguya sahip anlatıları otomatik çelişki saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Karşılaştırmada hangi iki alan öncelikle belirlenir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Karşılaştırmada hangi iki alan öncelikle belirlenir?",
      "expected_answer": "Sorulan tarih sorusu ve kullanılan kaynak seçimi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; farklı vurguya sahip anlatıları otomatik çelişki saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Olaysal/siyasi tarih",
      "Annales ve uzun süre",
      "Marksist tarih",
      "Kültürel tarih",
      "Mikro tarih",
      "Küresel/bağlantı tarihi",
      "Sözlü tarih",
      "Toplumsal cinsiyet tarihi"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-anakronizm",
    "esp_topic_id": "h-anakronizm",
    "discipline": "history",
    "title": "Anakronizm",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Geçmişi bugünün kavramlarıyla okumamak.",
    "explanation": "Geçmişe bugünün terimlerini açıklamadan taşımak dönem anlamını bozabilir. Modern adla sınıflandırma yapılacaksa bunun yorum olduğu belirtilir.",
    "worked_example": {
      "text": "Kurgusal eski metindeki vatandaş sözcüğünü güncel hukuki tanımıyla aynı sayma; dönemin kullanımını araştır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Aynı kelimeyi her dönemde aynı kurum veya hak yapısı saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Anakronizm riskini azaltmak için hangi bilgi gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Anakronizm riskini azaltmak için hangi bilgi gerekir?",
      "expected_answer": "Terimin döneme özgü anlamı ve bağlamı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; aynı kelimeyi her dönemde aynı kurum veya hak yapısı saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Ulus-devlet okuması",
      "Bugünün ahlakıyla yargılama",
      "Kaçınılmazlık yanılgısı",
      "Büyük adam indirgemesi",
      "Geriye dönük proje"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-tema-ekonomi",
    "esp_topic_id": "h-tema-ekonomi",
    "discipline": "history",
    "title": "Tematik: ekonomi ve teknoloji",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Siyasetin altındaki zemini görmek.",
    "explanation": "Ekonomi ve teknoloji tarihinde gösterge tanımı, birim ve veri kapsamını koru. Farklı yöntemlerle derlenen sayıları tek seri gibi birleştirme.",
    "worked_example": {
      "text": "Kurgusal iki nüfus/üretim tablosunun bölge sınırları farklı. Ham artış yüzdesi doğrudan karşılaştırılamaz.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Bölge veya birim farkını gerçek değişim gibi sunmak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "İki seriyi kıyaslamadan hangi koşullar eşlenmeli?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "İki seriyi kıyaslamadan hangi koşullar eşlenmeli?",
      "expected_answer": "Bölge, birim, dönem ve toplama yöntemi."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; bölge veya birim farkını gerçek değişim gibi sunmak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Tarım ve artı ürün",
      "Ticaret yolları",
      "Para ve kredi",
      "Sanayileşme",
      "Enerji geçişleri",
      "Krizler"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-tema-toplum",
    "esp_topic_id": "h-tema-toplum",
    "discipline": "history",
    "title": "Tematik: toplum ve nüfus",
    "content_depth": "orta",
    "esp_level_reference": 3,
    "cefr": null,
    "goal": "Kaynaklarda sesi az çıkanları görmek.",
    "explanation": "Toplum ve nüfus anlatısında kimlerin kayda girdiğini ve kimlerin görünmez kaldığını sor. Sayım kapsamı tüm nüfus temsiliyle aynı değildir.",
    "worked_example": {
      "text": "Kurgusal kayıt yalnız vergiye tabi haneleri içeriyor; bütün bireyler sayılmış gibi yorumlanmamalı.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Hane ile kişi sayısını aynı birim saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu kaydın kapsam sınırı nedir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu kaydın kapsam sınırı nedir?",
      "expected_answer": "Vergiye tabi haneler; bütün bireyleri doğrudan saymıyor."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; hane ile kişi sayısını aynı birim saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Salgınlar",
      "Göç ve yerleşme",
      "Şehirleşme",
      "Sınıf ve emek",
      "Kadınların tarihteki yeri",
      "Kölelik ve kaldırılışı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-tema-dusunce",
    "esp_topic_id": "h-tema-dusunce",
    "discipline": "history",
    "title": "Tematik: bilim ve düşünce",
    "content_depth": "ileri",
    "esp_level_reference": 4,
    "cefr": null,
    "goal": "Fikirlerin kendi kronolojisini izlemek.",
    "explanation": "Bilim ve düşünce tarihini tek kişinin keşif listesi gibi daraltma. Metinlerin dolaşımı, çeviri ve kurumsal bağlamı ayrı incele.",
    "worked_example": {
      "text": "Kurgusal eser başka dildeki metne atıf yapıyor. Sonuç özgün katkı mı, aktarma mı, uyarlama mı sorusu kaynak ister.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "İlk görülen yerel kaydı evrensel ilk keşif ilan etmek.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bu örnekte hangi aktarım ilişkileri araştırılır?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bu örnekte hangi aktarım ilişkileri araştırılır?",
      "expected_answer": "Atıf, çeviri, dolaşım ve özgün katkı ilişkileri."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; ilk görülen yerel kaydı evrensel ilk keşif ilan etmek.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Yazının ve matbaanın etkisi",
      "Bilim devrimi",
      "Aydınlanma",
      "Evrim ve modern biyoloji",
      "Bilgi çağı"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-anadolu",
    "esp_topic_id": "h-anadolu",
    "discipline": "history",
    "title": "Anadolu ve Türk tarihi",
    "content_depth": "orta",
    "esp_level_reference": 2,
    "cefr": null,
    "goal": "Kendi coğrafyanın çizgisini bütün olarak görmek.",
    "explanation": "Anadolu ve Türk tarihini bölge, dönem, aktör ve kaynak türüyle tanımla. Çok uzun dönemi tek değişmez kimlik veya kurum gibi temsil etme.",
    "worked_example": {
      "text": "Araştırma örneği: Aynı yerleşimin iki dönem haritası farklı ad ve idari sınır taşır. Kaynak bağlamını karşılaştır.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Güncel sınırı geçmiş dönemin sınırı saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Harita kıyasında hangi tarih bilgisi gerekir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Harita kıyasında hangi tarih bilgisi gerekir?",
      "expected_answer": "Haritanın üretim tarihi, temsil ettiği dönem ve sınır tanımı."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; güncel sınırı geçmiş dönemin sınırı saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Orta Asya ve göçler",
      "Selçuklu ve beylikler",
      "Osmanlı kuruluş–yükseliş–dönüşüm",
      "Tanzimat ve Meşrutiyet",
      "Kurtuluş Savaşı ve Cumhuriyet"
    ],
    "ready_for_app": false
  },
  {
    "id": "lesson-h-yontem",
    "esp_topic_id": "h-yontem",
    "discipline": "history",
    "title": "Kendi araştırman",
    "content_depth": "ileri",
    "esp_level_reference": 5,
    "cefr": null,
    "goal": "Kaynağa dayanan kendi yazını üretmek.",
    "explanation": "Araştırma sorusu kanıtla cevaplanabilecek ölçüde sınırlanmalı. Kaynak toplamak ve kaynakları aynı iddiaya bağlamak farklı işlerdir.",
    "worked_example": {
      "text": "Kurgusal soru: Bir kentin belirli on yıldaki ulaşımı nasıl değişti? Belgelerin tarih, yer ve konu kapsamını bu soruya göre seç.",
      "origin": "Özgün editör örneği; kurgusal olaylar tarihsel olgu veya kişi alıntısı değildir."
    },
    "common_misinterpretation": "Çok kaynak bağlantısını tamamlanmış araştırma saymak.",
    "practice": {
      "steps": [
        "Örnekteki ayrı bilgi türlerini işaretle.",
        "Bir kaynağın bu soruya uygunluğu nasıl değerlendirilir?",
        "Yanıtını aşağıdaki cevapla karşılaştır; eksik gerekçeyi ekle."
      ],
      "prompt": "Bir kaynağın bu soruya uygunluğu nasıl değerlendirilir?",
      "expected_answer": "Yer, dönem ve ulaşım bağlamına ilişkin kanıt içerip içermediğiyle."
    },
    "transfer": {
      "prompt": "Aynı ayrımı kendi seçtiğin yeni bir örnekte göster; çok kaynak bağlantısını tamamlanmış araştırma saymak.",
      "rubric": [
        "İlgili ayrımı yeni bağlamda doğru göster.",
        "İddia ile gözlem/yorum sınırını koru.",
        "Kaynak veya eksik bilgi gerektiğinde belirt."
      ]
    },
    "review_boundary": "Kaynaklar konu bağlamı içindir; bu özgün dersin öğrenme etkinliği araştırmayla doğrulanmadı. Alan öğretmeni incelemesi bekliyor.",
    "source_ids": [
      "loc"
    ],
    "source_role": "Genel konu ve yöntem bağlamı; her cümlenin veya tüm gelenek anlatısının kaynak onayı değildir.",
    "original_topic_items": [
      "Soru kurma",
      "Kaynak taraması",
      "Not ve künye düzeni",
      "Karşı-olgusal düşünme",
      "Yazma ve gerekçelendirme"
    ],
    "ready_for_app": false
  }
];

ESP.OGRENME_KARTI_BY_TOPIC = (function(){
  const m = {};
  ESP.OGRENME_KARTLARI.forEach(c => {
    if(c.esp_topic_id) m[c.esp_topic_id] = c;
    m[c.id] = c;
  });
  return m;
})();
