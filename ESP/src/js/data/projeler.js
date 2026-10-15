/* ESP Uygulama Projeleri (14 Proje, 70 Görev) ve Derinlikli Öğretim Örnekleri (21 Örnek)
   Kaynak: esp-profesyonel-v4 */

window.ESP = window.ESP || {};

ESP.PROJELER = [
  {
    "id": "project-language-notice",
    "discipline": "lang",
    "esp_topic_ids": [
      "l-aracilik",
      "l-cevrimici"
    ],
    "title": "Duyuruyu iki farklı kişiye doğru aktarma",
    "scenario": {
      "text": "Kurgusal duyuru: Yeni kayıtlar salı 17.00’de kapanır. Bu saate kadar kayıt açmış kişiler eksik belgeleri perşembe 12.00’ye kadar tamamlayabilir. Telefonla yeni kayıt alınmaz.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-language-notice-1",
        "question": "İki farklı son tarihi işlemleriyle eşleştir.",
        "sample_answer": "Salı 17.00 yeni kayıt sonu; perşembe 12.00 mevcut kaydın eksik belgelerini tamamlama sonu.",
        "criteria": [
          "Salı 17.00 ile yeni kaydı eşleştirir.",
          "Perşembe 12.00 ile yalnız eksik belge tamamlamayı eşleştirir."
        ]
      },
      {
        "id": "task-language-notice-2",
        "question": "Daha önce kayıt açmamış birine hangi tarihi anlatmalısın?",
        "sample_answer": "Yeni kayıt için salı 17.00; perşembe süresi yeni başvuru hakkı değildir.",
        "criteria": [
          "Yeni başvuru için salı 17.00 sınırını verir.",
          "Perşembe süresini yeni kayıt hakkı gibi göstermez."
        ]
      },
      {
        "id": "task-language-notice-3",
        "question": "Önceden kayıt açmış birine hangi ek koşul söylenmeli?",
        "sample_answer": "Perşembe 12.00 yalnız eksik belge tamamlaması için; yeni kayıt değildir.",
        "criteria": [
          "Kişinin salı 17.00’ye kadar kayıt açmış olması koşulunu korur.",
          "Belge tamamlama süresini perşembe 12.00 olarak verir."
        ]
      },
      {
        "id": "task-language-notice-4",
        "question": "Herkes perşembeye kadar başvurabilir özetinin kapsam hatasını göster.",
        "sample_answer": "Önceden kayıt açmış grup ile herkes grubu birleştirilmiş, işlem türü kaybolmuş.",
        "criteria": [
          "Herkes ifadesinin uygunluk grubunu genişlettiğini açıklar.",
          "Belge tamamlamayı yeni başvurudan ayırır."
        ]
      },
      {
        "id": "task-language-notice-5",
        "question": "Duyuruyu bir İngilizce mesajla aktar; tarih, grup ve işlem korunmalı.",
        "sample_answer": "Örnek: New registrations close on Tuesday at 5 pm. People registered by that deadline may complete missing documents by Thursday at noon. New registrations are not accepted by phone.",
        "criteria": [
          "İngilizce metinde her iki son saati ve hak sahibi grubu doğru aktarır.",
          "Telefonla yeni kayıt alınmaması koşulunu korur; eşdeğer İngilizce ifadeler kabul edilir."
        ]
      }
    ],
    "source_ids": [
      "cefr",
      "ud",
      "ud-parallel"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-language-comparison",
    "discipline": "lang",
    "esp_topic_ids": [
      "l-baglanti",
      "l-akademik"
    ],
    "title": "Çok dilli kaynak karşılaştırması",
    "scenario": {
      "text": "Görev kaynağı: sekiz-dil-paralel-cumleler.json içindeki aynı source_sent_id grubunu seç. İngilizce ve çalıştığın diğer dili karşılaştır; metinler kaynak çevirisidir, öğrenci çevirisi değildir.",
      "origin": "UD kaynak verisini inceleme görevi; metinlerin öğretim uygunluğu doğrulanmadı."
    },
    "tasks": [
      {
        "id": "task-language-comparison-1",
        "question": "İki metnin aynı gruba bağlı olduğunu hangi alanlarla gösterirsin?",
        "sample_answer": "Ortak source_sent_id ile farklı dil/repository/record_id alanları yan yana gösterilir.",
        "criteria": [
          "Ortak source_sent_id değerini iki kayıtta gösterir.",
          "Dil ve kaynak kayıt kimliklerini ayrı yazar."
        ]
      },
      {
        "id": "task-language-comparison-2",
        "question": "Bir dilde daha çok token bulunması neden daha zor metin anlamına gelmez?",
        "sample_answer": "Tokenleştirme ve dil yapıları farklı; uzunluk tek başına pedagojik zorluk değildir.",
        "criteria": [
          "Token sayısının kullanılan bölümleme yöntemine bağlı olduğunu belirtir.",
          "Tek başına uzunluktan öğrenen yeterliliği sonucu çıkarmaz."
        ]
      },
      {
        "id": "task-language-comparison-3",
        "question": "Metinlerdeki kişi, zaman ve koşul bilgilerini nasıl karşılaştırırsın?",
        "sample_answer": "Her bilgi türünü metindeki konumuyla eşleştir; emin olunmayan eşleşmeyi öğretmen incelemesi bekliyor diye işaretle.",
        "criteria": [
          "Kişi, zaman veya koşul bilgisini gerçek metin parçalarına dayandırır.",
          "Metinde bulunmayan veya emin olmadığı eşleşmeyi açıkça işaretler."
        ]
      },
      {
        "id": "task-language-comparison-4",
        "question": "Kaynak etiketini neden doğrudan CEFR düzeyi sayamazsın?",
        "sample_answer": "UD dilbilimsel anotasyon sağlar; kişinin yeterlilik veya cümlenin CEFR sertifikası değildir.",
        "criteria": [
          "UD etiketinin dilbilimsel anotasyon işlevini belirtir.",
          "CEFR yeterlilik değerlendirmesinin bu etiketten türetilemeyeceğini açıklar."
        ]
      },
      {
        "id": "task-language-comparison-5",
        "question": "Yeni bir Türkçe açıklama üretirken hangi bilgiler kaynak metne eklenmemeli?",
        "sample_answer": "Kaynakta bulunmayan kesin kişi, tarih, neden veya koşul eklenmemeli; yorum açık etiketlenmeli.",
        "criteria": [
          "Kaynakta olmayan kesin kişi veya tarih eklemez.",
          "Yorum ve açıklamayı kaynak içeriğinden açıkça ayırır."
        ]
      }
    ],
    "source_ids": [
      "cefr",
      "ud",
      "ud-parallel"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-logic-pump",
    "discipline": "philo",
    "esp_topic_ids": [
      "p-mantik",
      "p-analitik"
    ],
    "title": "Koşullardan sonuç çıkarma laboratuvarı",
    "scenario": {
      "text": "Kurgusal sistem: Pompa çalışırsa vana açıktır. Vana açık olsa bile elektrik yoksa pompa çalışmaz. Şu an vana açık; elektriğe dair veri yok.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-logic-pump-1",
        "question": "Vana açıkken pompanın çalıştığını kesin söyleyebilir misin?",
        "sample_answer": "Hayır. Verilen koşul tek yönlü ve elektrik bilgisi eksik.",
        "criteria": [
          "Vana açıklığından pompa çalışmasına ters çıkarım yapmaz.",
          "Elektrik bilgisinin eksik olduğunu ayrıca belirtir."
        ]
      },
      {
        "id": "task-logic-pump-2",
        "question": "Eksik bilgi ile elektriğin olmadığı bilgisi aynı mı?",
        "sample_answer": "Hayır; veri yok durumu olumsuz olgu değildir.",
        "criteria": [
          "Elektrik yok ile elektrik hakkında bilgi yok durumlarını ayırır.",
          "Bilinmeyen alanı olumsuz gözlem diye yazmaz."
        ]
      },
      {
        "id": "task-logic-pump-3",
        "question": "Pompanın çalıştığını gözlersen vana için ne çıkar?",
        "sample_answer": "Verilen ilk kural geçerliyse vananın açık olduğu çıkar.",
        "criteria": [
          "Pompa çalışıyorsa vana açık sonucunu verir.",
          "Çıkarımın verilen kurala dayandığını gösterir."
        ]
      },
      {
        "id": "task-logic-pump-4",
        "question": "Vana açık ve pompa çalışmıyor durumuna uyumlu bir açıklama ver.",
        "sample_answer": "Elektrik yok olabilir; fakat yalnız bu verilerle neden kesinleşmez.",
        "criteria": [
          "Elektrik kesintisini uyumlu olasılık olarak kurar.",
          "Bu olasılığı tek ve kanıtlanmış neden diye sunmaz."
        ]
      },
      {
        "id": "task-logic-pump-5",
        "question": "Vana açık ve elektrik var bilgisinin çalışmayı garanti etmesi için ne eklenmeli?",
        "sample_answer": "Bu iki koşulun birlikte çalışmak için yeterli olduğu ayrı kural gerekir; mevcut kurallar yeterliliği söylemiyor.",
        "criteria": [
          "Vana açık ve elektrik var ise pompa çalışır biçiminde yeni yeterlilik kuralı yazar.",
          "Bu kuralın mevcut öncüllerde bulunmadığını söyler."
        ]
      }
    ],
    "source_ids": [
      "sep-logic",
      "sep-ethics"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-ethics-queue",
    "discipline": "philo",
    "esp_topic_ids": [
      "p-etik",
      "p-siyaset"
    ],
    "title": "Adalet ölçütlerini aynı kararda karşılaştırma",
    "scenario": {
      "text": "Kurgusal bir yardım programında üç kişi aynı kaynak için başvuruyor. A kişisinin ihtiyacı yüksek, B uzun süredir bekliyor, C daha önce hiç destek almamış. Kaynak yalnız bir kişiye yeterli.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-ethics-queue-1",
        "question": "Karardaki üç farklı dağıtım ölçütünü ayır.",
        "sample_answer": "İhtiyaç düzeyi, bekleme süresi ve önceki destekten yararlanma durumu.",
        "criteria": [
          "İhtiyaç, bekleme ve önceki destek ölçütlerini ayrı listeler.",
          "Kişilere verilen bilgiler dışında özellik uydurmaz."
        ]
      },
      {
        "id": "task-ethics-queue-2",
        "question": "Yalnız bekleme süresine göre karar vermek hangi bilgiyi ikincil bırakır?",
        "sample_answer": "İhtiyaç ve önceki destek durumu; bu tercih gerekçeyle açıklanmalı.",
        "criteria": [
          "Bekleme önceliğinin ihtiyaç ve önceki desteği ikincil bıraktığını belirtir.",
          "Ölçüt seçimini olgu gibi değil gerekçeli tercih gibi açıklar."
        ]
      },
      {
        "id": "task-ethics-queue-3",
        "question": "A ya yardım vermek bütün etik çerçevelerde tek doğru diye sunulabilir mi?",
        "sample_answer": "Hayır; seçilen ölçüt ve ek koşullar belirtilmeden evrensel sonuç çıkarılmaz.",
        "criteria": [
          "A seçiminin gerekçesini ihtiyaç önceliğiyle sınırlar.",
          "Tüm etik yaklaşımların zorunlu olarak aynı sonuca varacağını iddia etmez."
        ]
      },
      {
        "id": "task-ethics-queue-4",
        "question": "Ölçütler arasında çatışmayı görünür yapan kısa tablo nasıl kurulur?",
        "sample_answer": "Her kişi için ihtiyaç, bekleme ve önceki destek alanları; ardından seçilen öncelik ve gerekçe.",
        "criteria": [
          "Üç kişiyi üç ölçütle aynı tabloda karşılaştırır.",
          "Verilmeyen hücreleri bilinmiyor olarak bırakır."
        ]
      },
      {
        "id": "task-ethics-queue-5",
        "question": "Karşı görüşü güçlü biçimde yaz ve yanıtının sınırını belirt.",
        "sample_answer": "Örnek: Uzun bekleyene öncelik güveni koruyabilir; ihtiyaç önceliği aciliyeti gözetir. Yanıt hangi hedefi önceliklendirdiğini açıklamalı.",
        "criteria": [
          "Rakip önceliğin savunulabilir gerekçesini aktarır.",
          "Kendi tercihinin hangi hedefi ve bedeli kabul ettiğini belirtir."
        ]
      }
    ],
    "source_ids": [
      "sep-logic",
      "sep-ethics"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-music-meter",
    "discipline": "music",
    "esp_topic_ids": [
      "m-acik",
      "m-teori"
    ],
    "title": "Ritim ve nabız birimini birlikte hesaplama",
    "scenario": {
      "text": "Kurgusal alıştırmada 3/4 ölçüde dörtlük nabız 72 BPM, başka kayıtta 6/8 ölçüde noktalı dörtlük nabız 72 BPM. İkisinin de içindeki sekizlik akışı hesaplanacak.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-music-meter-1",
        "question": "3/4 kaydında dakikadaki sekizlik sayısı nedir?",
        "sample_answer": "72×2 = 144 sekizlik/dakika.",
        "criteria": [
          "Dörtlük başına iki sekizlik dönüşümünü gösterir.",
          "144 sekizlik/dakika sonucunu birimiyle verir."
        ]
      },
      {
        "id": "task-music-meter-2",
        "question": "6/8 kaydında dakikadaki sekizlik sayısı nedir?",
        "sample_answer": "72×3 = 216 sekizlik/dakika.",
        "criteria": [
          "Noktalı dörtlük başına üç sekizlik dönüşümünü gösterir.",
          "216 sekizlik/dakika sonucunu birimiyle verir."
        ]
      },
      {
        "id": "task-music-meter-3",
        "question": "İki kaydın BPM sayısı eşitken alt bölüm hızı neden eşit değil?",
        "sample_answer": "Sayılan nota değeri farklı; bir nabız iki veya üç sekizlik taşıyor.",
        "criteria": [
          "İki kayıtta vuruşun nota değerlerinin farklı olduğunu belirtir.",
          "Aynı 72 sayısının farklı alt bölüm akışına karşılık geldiğini açıklar."
        ]
      },
      {
        "id": "task-music-meter-4",
        "question": "3/4 kaydında bir ölçünün süresi nedir?",
        "sample_answer": "3×60/72 = 2,5 saniye.",
        "criteria": [
          "3/4 için üç dörtlük vuruşu sayar.",
          "3×60/72=2,5 saniye hesabını verir."
        ]
      },
      {
        "id": "task-music-meter-5",
        "question": "6/8 kaydında bir ölçünün süresi nedir?",
        "sample_answer": "2×60/72 ≈ 1,667 saniye; ölçüde iki noktalı dörtlük nabız var.",
        "criteria": [
          "Bu 6/8 örneğinde iki noktalı dörtlük vuruşu sayar.",
          "2×60/72≈1,667 saniye hesabını ve yuvarlamayı gösterir."
        ]
      }
    ],
    "source_ids": [
      "pugetsound-meter",
      "omt-scales",
      "mutopia",
      "mutopia-all"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-music-source",
    "discipline": "music",
    "esp_topic_ids": [
      "m-gam",
      "m-repertuar"
    ],
    "title": "Eser bağlantısından çalışma malzemesine geçiş",
    "scenario": {
      "text": "Mutopia katalog kaydı bir eser sayfası ve PDF/MIDI bağlantıları içeriyor. Bu v3 tesliminde dosyalar indirilmedi; katalogdaki lisans bağlantısı yalnız aday.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-music-source-1",
        "question": "Katalog bağlantısının varlığı hangi kontrolleri tamamlamaz?",
        "sample_answer": "Eser içeriği, teknik doğruluk, çalgı uygunluğu ve tekil lisans eşleşmesini.",
        "criteria": [
          "Bağlantı varlığı ile nota içeriğinin incelenmesini ayırır.",
          "Tekil lisans, çalgı ve teknik uygunluk kontrollerinin açık kaldığını belirtir."
        ]
      },
      {
        "id": "task-music-source-2",
        "question": "Bir çalışma nüshasını tanımlamak için hangi kimlikler gerekir?",
        "sample_answer": "Eser, düzenleme/baskı, çalgı, kaynak URL, lisans ve seçilen bölüm.",
        "criteria": [
          "Eser ve düzenleme/baskı kimliğini ayrı verir.",
          "URL, çalgı, bölüm ve doğrulanacak lisans alanlarını ekler."
        ]
      },
      {
        "id": "task-music-source-3",
        "question": "Bilgisayar üretimi MIDI önizlemesi profesyonel icra örneği midir?",
        "sample_answer": "Otomatik olarak değil; medya türü ve üretim yöntemi ayrı tanımlanmalı.",
        "criteria": [
          "MIDI üretim yöntemi ile insan icrasını ayırır.",
          "Dinlenmemiş dosyanın yorum niteliğini varsaymaz."
        ]
      },
      {
        "id": "task-music-source-4",
        "question": "Perde sınıfı listesini doğrudan nota yazımı saymak neden riskli?",
        "sample_answer": "Enharmonik adlandırma, oktav ve ritmik değerler ayrıca belirlenmeli.",
        "criteria": [
          "Perde sınıfının oktav bilgisini vermediğini açıklar.",
          "Ritim ve enharmonik nota adlandırmasının ayrıca gerektiğini söyler."
        ]
      },
      {
        "id": "task-music-source-5",
        "question": "Kaynak dosyası incelenmeden çalışma düzeyi atanabilir mi?",
        "sample_answer": "Bu veriyle atanmaz; zorluk, teknik hedef ve uygunluk incelemesi gerekir.",
        "criteria": [
          "İncelenmemiş dosyaya kesin çalışma düzeyi atamaz.",
          "Teknik gereklilik ve öğrenme hedefi incelemesi ister."
        ]
      }
    ],
    "source_ids": [
      "pugetsound-meter",
      "omt-scales",
      "mutopia",
      "mutopia-all"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-diction-script",
    "discipline": "diction",
    "esp_topic_ids": [
      "d-vurgu",
      "d-sunum"
    ],
    "title": "Dinleyiciye göre duyuru seslendirme",
    "scenario": {
      "text": "Kurgusal duyuru: B kapısı bakım nedeniyle kapalı. Ziyaretçiler A kapısını kullanacak. Personel, kartlı geçiş için C kapısını kullanabilecek. Bu alıştırmada ziyaretçi ve personel olmak üzere iki dinleyici grubu ele alınıyor.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-diction-script-1",
        "question": "Bütün dinleyicilerin ortak bilmesi gereken bilgi nedir?",
        "sample_answer": "B kapısının bakım nedeniyle kapalı olduğu.",
        "criteria": [
          "B kapısının kapalı olduğunu söyler.",
          "Bakım nedenini korur."
        ]
      },
      {
        "id": "task-diction-script-2",
        "question": "Ziyaretçiye hangi işlem yönlendirmesi verilir?",
        "sample_answer": "A kapısını kullanması.",
        "criteria": [
          "Ziyaretçiyi A kapısına yönlendirir.",
          "Personelin C seçeneğini ziyaretçiye genişletmez."
        ]
      },
      {
        "id": "task-diction-script-3",
        "question": "Personel için hangi koşul korunur?",
        "sample_answer": "C kapısı kartlı geçiş için personelin kullanabileceği seçenek.",
        "criteria": [
          "C seçeneğini personele bağlar.",
          "Kartlı geçiş koşulunu korur."
        ]
      },
      {
        "id": "task-diction-script-4",
        "question": "Herkes C kapısından girebilir seslendirmesinin hatası nedir?",
        "sample_answer": "Personel ve kartlı geçiş koşulu düşürülmüş.",
        "criteria": [
          "Herkes sözcüğünün grup sınırını sildiğini gösterir.",
          "Kartlı geçiş koşulunun da kaybolduğunu belirtir."
        ]
      },
      {
        "id": "task-diction-script-5",
        "question": "İki seslendirme sürümünü hangi ölçütlerle karşılaştırırsın?",
        "sample_answer": "İşlem, grup ve koşulun anlaşılması; vurgu ve durakların bu anlamı koruması.",
        "criteria": [
          "Dinleyicinin doğru kapıyı ve koşulu anlama ölçütünü tanımlar.",
          "Vurgu ve durağı anlamı koruma açısından karşılaştırır; ses kaydı yoksa icra puanı vermez."
        ]
      }
    ],
    "source_ids": [
      "nidcd"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-diction-count",
    "discipline": "diction",
    "esp_topic_ids": [
      "d-hiz",
      "d-bogumlama"
    ],
    "title": "Konuşma kaydında aynı oranı farklı bağlamda görmek",
    "scenario": {
      "text": "Kurgusal A kaydı 180 kelime/90 saniye ve 9 işaretli hata, B kaydı 120 kelime/60 saniye ve 6 işaretli hata. Hata tanımları ve kayıt koşulları aynı varsayılıyor.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-diction-count-1",
        "question": "İki toplam süre hızını hesapla.",
        "sample_answer": "A: 180/(90/60)=120; B: 120/(60/60)=120 kelime/dakika.",
        "criteria": [
          "90 saniyeyi 1,5 dakika; 60 saniyeyi 1 dakika olarak kullanır.",
          "İki kaydı da 120 kelime/dakika bulur."
        ]
      },
      {
        "id": "task-diction-count-2",
        "question": "İki işaretli hata oranını hesapla.",
        "sample_answer": "A: 9/180=%5; B: 6/120=%5.",
        "criteria": [
          "Hata sayısını kelime sayısına böler.",
          "Her iki kayıt için yüzde 5 bulur; tanımın aynı olduğu varsayımını korur."
        ]
      },
      {
        "id": "task-diction-count-3",
        "question": "Eşit oranlar bütün konuşma niteliğinin eşit olduğunu gösterir mi?",
        "sample_answer": "Hayır; anlam aktarımı, görev ve dinleyiciye uygunluk ayrı incelenir.",
        "criteria": [
          "Sayı eşitliğini genel konuşma niteliğiyle özdeşleştirmez.",
          "Anlam aktarımı veya dinleyiciye uygunluk gibi ayrı bir ölçüt örnekler."
        ]
      },
      {
        "id": "task-diction-count-4",
        "question": "Hatalar kullanıcı tarafından işaretlendiyse kaynak türü nasıl belirtilir?",
        "sample_answer": "Kullanıcı beyanı/öz değerlendirme; bağımsız sistem ses analizi diye sunulmaz.",
        "criteria": [
          "İşaretleri kullanıcı beyanı veya öz değerlendirme olarak tanımlar.",
          "Bağımsız otomatik ses analizi yapılmış gibi yazmaz."
        ]
      },
      {
        "id": "task-diction-count-5",
        "question": "Metinler farklıysa karşılaştırmada ne görünür olmalı?",
        "sample_answer": "Metin türü, sözcük/ifade güçlüğü ve konuşma görevi; sayı eşliği bu farkları kaldırmaz.",
        "criteria": [
          "Metin türü ve konuşma görevi farklarını belirtir.",
          "Farklı güçlüklerin aynı sayıdan kalite eşitliği çıkarmayı engellediğini açıklar."
        ]
      }
    ],
    "source_ids": [
      "nidcd"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-reading-two",
    "discipline": "reading",
    "esp_topic_ids": [
      "r-analitik",
      "r-sentopik"
    ],
    "title": "İki metni ortak soruda karşılaştırma",
    "scenario": {
      "text": "Kurgusal A metni: Ücretsiz ulaşım erişimi artırabilir; maliyet bütçeden karşılanır. B metni: Daha sık sefer bekleme süresini azaltabilir; talep ve işletme maliyeti incelenmeli.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-reading-two-1",
        "question": "İki metnin aynı soruya cevap verebileceği ortak çerçeve nedir?",
        "sample_answer": "Ulaşım erişimini hangi araçlarla geliştirmek mümkün?",
        "criteria": [
          "Her iki metni kapsayan ulaşım erişimi sorusu kurar.",
          "Ortak soruyu metinlerden yalnız birinin aracına indirgemez."
        ]
      },
      {
        "id": "task-reading-two-2",
        "question": "Her metnin önerdiği araç nedir?",
        "sample_answer": "A ücretin kaldırılması, B sefer sıklığının artırılması.",
        "criteria": [
          "A için ücret kaldırmayı belirtir.",
          "B için sefer sıklığını artırmayı belirtir."
        ]
      },
      {
        "id": "task-reading-two-3",
        "question": "Bu metinler otomatik olarak birbirine karşıt mı?",
        "sample_answer": "Hayır; farklı araçları ele alıyorlar, birlikte uygulanma veya çatışma için ek bağlam gerekir.",
        "criteria": [
          "Farklı önerilerin zorunlu olarak karşıt olmadığını açıklar.",
          "Birlikte uygulanabilirlik için ek bağlam gerektiğini belirtir."
        ]
      },
      {
        "id": "task-reading-two-4",
        "question": "İki öneride hangi maliyet koşulları görünür?",
        "sample_answer": "A bütçeden ödeme; B talep ve işletme maliyeti incelemesi.",
        "criteria": [
          "A için bütçeden karşılanan maliyeti korur.",
          "B için talep ve işletme maliyeti incelemesini korur."
        ]
      },
      {
        "id": "task-reading-two-5",
        "question": "Karşılaştırma matrisine hangi sütunlar konur?",
        "sample_answer": "Ortak soru, önerilen araç, gerekçe, maliyet/koşul, eksik veri ve kaynak konumu.",
        "criteria": [
          "Her iki metni ortak soru ve araç sütunlarında karşılaştırır.",
          "Koşul, eksik bilgi ve kaynak konumunu görünür kılar."
        ]
      }
    ],
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-reading-evidence",
    "discipline": "reading",
    "esp_topic_ids": [
      "r-not",
      "r-elestiri"
    ],
    "title": "Bir alıntının iddiayı hangi ölçüde desteklediği",
    "scenario": {
      "text": "Kurgusal kaynak: Katılımcıların 12 si yeni rotayı daha rahat buldu. Toplam katılımcı sayısı ve seçim yöntemi belirtilmemiş. Notta Çoğunluk yeni rotayı beğeniyor deniyor.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-reading-evidence-1",
        "question": "Kaynakta doğrudan verilen sayı nedir?",
        "sample_answer": "Yeni rotayı daha rahat bulan 12 katılımcı.",
        "criteria": [
          "12 katılımcı sayısını aynen kullanır.",
          "Ölçülen ifadeyi daha rahat bulma olarak korur."
        ]
      },
      {
        "id": "task-reading-evidence-2",
        "question": "Çoğunluk sonucunu çıkarmak için hangi temel bilgi eksik?",
        "sample_answer": "Toplam katılımcı sayısı/payda.",
        "criteria": [
          "Çoğunluk için toplam katılımcı sayısının gerekli olduğunu söyler.",
          "Verilmeyen toplamı tahmin etmez."
        ]
      },
      {
        "id": "task-reading-evidence-3",
        "question": "Rahat bulma ile beğenme aynı soru ölçümü müdür?",
        "sample_answer": "Otomatik olarak değil; sorulan soru ve yanıt ölçütü farklı olabilir.",
        "criteria": [
          "Rahat bulma ve beğenme ifadelerini ayırır.",
          "Eşdeğerlik için soru/ölçüm tanımının incelenmesi gerektiğini söyler."
        ]
      },
      {
        "id": "task-reading-evidence-4",
        "question": "Kapsamı koruyan not nasıl yazılır?",
        "sample_answer": "İncelenen kayıtta 12 kişi daha rahat bulduğunu belirtmiş; toplam ve yöntem bilinmiyor.",
        "criteria": [
          "12 kişinin beyanını sınırlı kaynak gözlemi olarak aktarır.",
          "Toplamın ve seçim yönteminin bilinmediğini ekler."
        ]
      },
      {
        "id": "task-reading-evidence-5",
        "question": "Bu notun üretim görevinde hangi etiketler ayrı tutulur?",
        "sample_answer": "Kaynak gözlemi, eksik bilgi ve okuyucunun yorumu.",
        "criteria": [
          "Gözlem, eksik bilgi ve yorumu ayrı alanlara yerleştirir.",
          "Yorumu kaynakta geçen doğrudan ifade gibi göstermez."
        ]
      }
    ],
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-writing-brief",
    "discipline": "writing",
    "esp_topic_ids": [
      "w-yapi",
      "w-tur"
    ],
    "title": "Aynı veriden iki tür metin üretme",
    "scenario": {
      "text": "Kurgusal veri: Mahallede akşam otobüsleri seyrek. Üç görüşmede geç vardiyadan çıkanlar beklediklerini söylüyor. Sefer maliyeti ve toplam talep bilinmiyor. Belediye raporu ve kişisel deneme hazırlanacak.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-writing-brief-1",
        "question": "Raporda kaynak kapsamı nasıl belirtilir?",
        "sample_answer": "Üç görüşmeye dayanan gözlem olduğu; tüm mahalleyi temsil ettiğinin doğrulanmadığı.",
        "criteria": [
          "Üç görüşmeye dayanıldığını belirtir.",
          "Bütün mahalleyi temsil etme iddiasından kaçınır."
        ]
      },
      {
        "id": "task-writing-brief-2",
        "question": "Kişisel denemede hangi ek katman açıkça etiketlenir?",
        "sample_answer": "Yazarın deneyimi ve yorumu; kaynak verisiyle birleştirilmez.",
        "criteria": [
          "Yazarın kişisel deneyim veya yorumunu açık işaretler.",
          "Yeni kurgusal ayrıntıyı görüşme verisi gibi sunmaz."
        ]
      },
      {
        "id": "task-writing-brief-3",
        "question": "Bütün mahalle mağdur başlığının kapsam sorunu nedir?",
        "sample_answer": "Üç görüşmeden tüm mahalleye genelleme yapıyor.",
        "criteria": [
          "Üç görüşmeden bütün mahalleye geçişi gösterir.",
          "Başlığın kaynak kapsamını aştığını açıklar."
        ]
      },
      {
        "id": "task-writing-brief-4",
        "question": "Karar raporunda hangi eksik bilgiler sıralanır?",
        "sample_answer": "Toplam talep, sefer maliyeti, saat/rota koşulları ve alternatifler.",
        "criteria": [
          "Talep ve sefer maliyetinin bilinmediğini söyler.",
          "Karar için saat, rota veya alternatif bilgisinin nasıl kullanılacağını belirtir."
        ]
      },
      {
        "id": "task-writing-brief-5",
        "question": "İki türün ortak korunması gereken bilgi nedir?",
        "sample_answer": "Verinin gerçek dar kapsamı ve bilinmeyen alanlar.",
        "criteria": [
          "Tür değişse de üç görüşmelik kapsamı korur.",
          "Bilinmeyen talep ve maliyeti gerçek sayı gibi doldurmaz."
        ]
      }
    ],
    "source_ids": [
      "purdue"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-writing-version",
    "discipline": "writing",
    "esp_topic_ids": [
      "w-revizyon",
      "w-uzun"
    ],
    "title": "İki revizyonun işlev farkını görmek",
    "scenario": {
      "text": "Kurgusal ilk taslak: Talep yeterliyse akşam seferini artıralım. Ek maliyet önemli bir itirazdır. V2: Akşam seferini artıralım. V3: Talep yeterliyse akşam seferini artıralım; maliyet itirazını değerlendirmek için önce bir ek seferin giderini ve beklenen yolcu sayısını ölçelim.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-writing-version-1",
        "question": "V2 nin görünür değişikliği ve olası anlam kaybı nedir?",
        "sample_answer": "Cümleler kısalmış; önerinin koşulu kaybolmuş.",
        "criteria": [
          "V2’de talep yeterliyse koşulunun silindiğini gösterir.",
          "Kısalmanın öneriyi koşulsuzlaştırdığını açıklar."
        ]
      },
      {
        "id": "task-writing-version-2",
        "question": "V3 ün yeni işlevi nedir?",
        "sample_answer": "Talep koşulunu koruyarak maliyet itirazının nasıl inceleneceğini açıklamak; maliyetin karşılandığını kanıtlamıyor.",
        "criteria": [
          "V3’te talep koşulunun kaldığını gösterir.",
          "Maliyete yanıtın veri toplama önerisi olduğunu, çözüm kanıtı olmadığını belirtir."
        ]
      },
      {
        "id": "task-writing-version-3",
        "question": "Kelime sayısı artışı hangi durumda yeni katkı sayılabilir?",
        "sample_answer": "Yeni açıklama, kanıt, itiraz veya gerekçe işlevi eklediğinde.",
        "criteria": [
          "Eklenen sözün açıklama, gerekçe veya itiraz işlevini adlandırır.",
          "Yalnız kelime artışını kalite ölçütü saymaz."
        ]
      },
      {
        "id": "task-writing-version-4",
        "question": "Revizyon günlüğüne hangi alanlar yazılır?",
        "sample_answer": "Önceki ifade, yeni ifade, değişiklik amacı, korunan/kaybolan anlam ve gerekçe.",
        "criteria": [
          "Önce ve sonra ifadelerini birlikte kaydeder.",
          "Değişiklik amacı ile anlam kazancı/kaybını ilişkilendirir."
        ]
      },
      {
        "id": "task-writing-version-5",
        "question": "En kısa sürüm otomatik olarak en iyi seçilebilir mi?",
        "sample_answer": "Hayır; amaç, kapsam, açıklık ve gerekçe ilişkisi birlikte değerlendirilir.",
        "criteria": [
          "Amaç ve anlamın korunmasını kısalıktan ayrı değerlendirir.",
          "Metinlerden bir somut koşul kaybı örneği verir."
        ]
      }
    ],
    "source_ids": [
      "purdue"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-history-doc",
    "discipline": "history",
    "esp_topic_ids": [
      "h-kronoloji",
      "h-kaynak"
    ],
    "title": "Üç belgeyi tarihle ve aktarım yolu ile ayırma",
    "scenario": {
      "text": "Kurgusal A belge 1905 te yazılmış, 1903 olayını anlatıyor. B 1930 da A yı kopyalamış. C 1904 tarihli farklı bir üreticiye ait ve aynı olayla ilgili. Hepsi modern bir derlemede okunuyor.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-history-doc-1",
        "question": "A için olay ve üretim tarihlerini ayır.",
        "sample_answer": "Olay 1903; belge üretimi 1905.",
        "criteria": [
          "Olay tarihini 1903 olarak ayırır.",
          "A belgesinin üretim tarihini 1905 olarak ayırır."
        ]
      },
      {
        "id": "task-history-doc-2",
        "question": "B nin varlığı neden ikinci bağımsız gözlem değildir?",
        "sample_answer": "A nın kopyası olduğu için; aktarım zinciri aynı.",
        "criteria": [
          "B’nin A’dan kopyalandığı aktarım bağını gösterir.",
          "İki belgenin sayısını iki bağımsız tanıklıkla eşitlemez."
        ]
      },
      {
        "id": "task-history-doc-3",
        "question": "C hangi nedenle ayrı incelenmeye değer?",
        "sample_answer": "C farklı bir üreticiye ait olduğu için ayrı incelenir; ortak kaynak veya aktarım ilişkisi bilinmeden bağımsızlığı ve doğruluğu kesinleşmez.",
        "criteria": [
          "Farklı üretici bilgisini ayrı inceleme gerekçesi yapar.",
          "Farklı üreticinin tek başına bağımsızlık veya doğruluk kanıtı olmadığını belirtir."
        ]
      },
      {
        "id": "task-history-doc-4",
        "question": "Modern derleme tarihi olay tarihi yerine kullanılabilir mi?",
        "sample_answer": "Hayır; kullanılan yayın kimliği olarak ayrı tutulur.",
        "criteria": [
          "Modern derlemenin yayın tarihini ayrı alan olarak tutar.",
          "Bu tarihi olay tarihi yerine koymaz."
        ]
      },
      {
        "id": "task-history-doc-5",
        "question": "Kaynak haritasında hangi oklar ve alanlar gerekir?",
        "sample_answer": "A→B kopyalama ilişkisi; üretici, olay/üretim/yayın tarihleri ve belge konumu.",
        "criteria": [
          "A’dan B’ye kopyalama okunu kurar.",
          "Olay, üretim, yayın, üretici ve belge konumu alanlarını ayırır."
        ]
      }
    ],
    "source_ids": [
      "loc"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  },
  {
    "id": "project-history-mechanism",
    "discipline": "history",
    "esp_topic_ids": [
      "h-neden",
      "h-tema-toplum"
    ],
    "title": "Neden iddiasını payda ve mekanizmayla sınama",
    "scenario": {
      "text": "Kurgusal iki nüfus tablosunda 1910: 2.000 hane, 1920: 3.000 kişi yazıyor. Aynı dönemde yol açıldığı için nüfusun %50 büyüdüğü ve yolun tek neden olduğu iddia ediliyor.",
      "origin": "Özgün kurgusal editör örneği; gerçek kişi veya araştırma sonucu değildir."
    },
    "tasks": [
      {
        "id": "task-history-mechanism-1",
        "question": "%50 hesabının karşılaştırma sorunu nedir?",
        "sample_answer": "Hane ile kişi farklı birimler; doğrudan yüzde hesabı aynı nüfusu karşılaştırmıyor.",
        "criteria": [
          "1910’daki hane ile 1920’deki kişi birimlerini ayırır.",
          "Bu değerlerden doğrudan yüzde büyüme çıkarmayı reddeder."
        ]
      },
      {
        "id": "task-history-mechanism-2",
        "question": "Birim eşlemesi olmadan hangi sonuç askıda kalır?",
        "sample_answer": "Nüfusun gerçekten %50 arttığı sonucu.",
        "criteria": [
          "Yüzde 50 büyüme iddiasını doğrulanmamış bırakır.",
          "Birimi eşleştirecek veri olmadan hane büyüklüğü uydurmaz."
        ]
      },
      {
        "id": "task-history-mechanism-3",
        "question": "Zaman sırası yolun tek neden olduğunu doğrular mı?",
        "sample_answer": "Hayır; mekanizma ve alternatif etkenler ayrıca incelenir.",
        "criteria": [
          "Yolun açılması ile değişimin zaman ilişkisini nedensellikten ayırır.",
          "Mekanizma veya alternatif etken incelemesi önerir."
        ]
      },
      {
        "id": "task-history-mechanism-4",
        "question": "Kaynak tablosuna hangi alanlar eklenir?",
        "sample_answer": "Birim, bölge sınırı, sayım yöntemi, tarih ve kapsam.",
        "criteria": [
          "Birim ve bölge sınırını kaydeder.",
          "Sayım tarihi, yöntemi ve kapsamını kaydeder."
        ]
      },
      {
        "id": "task-history-mechanism-5",
        "question": "Daha savunulabilir araştırma sorusu nedir?",
        "sample_answer": "Aynı kapsam ve birimde nüfus nasıl değişti ve yol bu değişime hangi mekanizmayla katkı sağlamış olabilir?",
        "criteria": [
          "Aynı birim ve kapsamda değişimi sorar.",
          "Yolun olası katkısını mekanizma ve alternatiflerle araştırılabilir hale getirir."
        ]
      }
    ],
    "source_ids": [
      "loc"
    ],
    "content_origin": "Özgün editör projesi; yöntem kaynakları her cümle için onay veya etki testi değildir.",
    "ready_for_app": false,
    "revision": 4
  }
];

ESP.PROJE_BY_ID = (function(){
  const m = {};
  ESP.PROJELER.forEach(p => { m[p.id] = p; });
  return m;
})();

ESP.DERINLIKLI_ORNEKLER = [
  {
    "id": "depth-lang-1",
    "discipline": "lang",
    "project_id": "project-language-notice",
    "title": "Dil: anlamı koruyarak aktarma",
    "depth": "basit",
    "focus": "Tek işlem ve son saat",
    "material": "Kayıt bugün 16.00’da kapanır.",
    "prompt": "Bir arkadaşına son saati tek cümleyle aktar.",
    "worked_solution": "Kayıt bugün saat 16.00’da kapanıyor.",
    "reasoning": "Gün ve saat korunur; yeni koşul eklenmez.",
    "common_error": "Bugün yerine yarın yazmak zaman bilgisini değiştirir.",
    "prerequisite_unit_id": null,
    "suggested_stop_rule": "Tek ayrımı yeni bir küçük örnekte koruyabiliyorsa aynı açıklamayı uzatma.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-lang-2",
    "discipline": "lang",
    "project_id": "project-language-notice",
    "title": "Dil: anlamı koruyarak aktarma",
    "depth": "orta",
    "focus": "Koşullu hakkı koruma",
    "material": "Yeni kayıt salı 17.00’de biter. O saate kadar kayıt olanlar belgelerini perşembe 12.00’ye kadar tamamlayabilir.",
    "prompt": "Yeni başvuracak kişi ile daha önce kayıt olan kişiye iki ayrı mesaj yaz.",
    "worked_solution": "Yeni başvuracak kişiye: Salı 17.00’ye kadar kaydol. Kayıtlı kişiye: Eksik belgelerini perşembe 12.00’ye kadar tamamlayabilirsin.",
    "reasoning": "İşlem, grup ve son saat ayrı eşleştirilir.",
    "common_error": "Perşembe süresini herkes için yeni kayıt süresi saymak.",
    "prerequisite_unit_id": "depth-lang-1",
    "suggested_stop_rule": "Koşulu ve gerekçeyi yeni örnekte koruyabiliyorsa ileri inceleme isteğine göre ilerle.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-lang-3",
    "discipline": "lang",
    "project_id": "project-language-notice",
    "title": "Dil: anlamı koruyarak aktarma",
    "depth": "ileri",
    "focus": "Belirsizlik ve aracılık",
    "material": "A duyurusu yeni kayıtların salı 17.00’de bittiğini söylüyor. B duyurusu yalnız Başvurular perşembeye uzatıldı diyor; hangi işlem olduğu belirtilmiyor.",
    "prompt": "İngilizce bilgi isteyen kişiye kesin olanı aktar, çelişkiyi açıkla ve açıklama isteyecek soruyu yaz.",
    "worked_solution": "One notice says new registrations close on Tuesday at 5 pm. Another says applications are extended to Thursday, but the affected process is unclear. Does the extension cover new registrations or only missing documents?",
    "reasoning": "İki kaynağın kapsamı ayrı korunur; uyuşmazlık tahminle çözülmez.",
    "common_error": "İkinci metni okuyup ilk son tarihi sessizce değiştirmek.",
    "prerequisite_unit_id": "depth-lang-2",
    "suggested_stop_rule": "Karşı örnek, veri sınırı ve üretim gerekçesini birlikte kaydet; ek uzunluk tek başına başarı değildir.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-philo-1",
    "discipline": "philo",
    "project_id": "project-logic-pump",
    "title": "Felsefe: koşuldan sonuca",
    "depth": "basit",
    "focus": "Kuralı doğru yönde kullanma",
    "material": "Lamba yanıyorsa devrede elektrik vardır. Lamba yanıyor.",
    "prompt": "Kurala göre ne çıkar?",
    "worked_solution": "Devrede elektrik vardır.",
    "reasoning": "Verilen öncül, koşulun ön tarafını sağlıyor.",
    "common_error": "Bu örnekte bulunmayan teknik arıza bilgisi eklemek.",
    "prerequisite_unit_id": null,
    "suggested_stop_rule": "Tek ayrımı yeni bir küçük örnekte koruyabiliyorsa aynı açıklamayı uzatma.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-philo-2",
    "discipline": "philo",
    "project_id": "project-logic-pump",
    "title": "Felsefe: koşuldan sonuca",
    "depth": "orta",
    "focus": "Gerekli koşulu yeterli sanmama",
    "material": "Lamba yanıyorsa elektrik vardır. Elektrik var. Başka bilgi yok.",
    "prompt": "Lambanın yandığı kesin mi? Bir karşı örnek kur.",
    "worked_solution": "Kesin değil; elektrik bulunurken lamba anahtarı kapalı olabilir. Bu olasılık ilk kuralla çelişmez.",
    "reasoning": "Örnek bir teknik olgu iddiası değil, öncüllerle uyumlu kurgusal durumdur.",
    "common_error": "Elektrik var bilgisinden lambanın kesin yandığını çıkarmak.",
    "prerequisite_unit_id": "depth-philo-1",
    "suggested_stop_rule": "Koşulu ve gerekçeyi yeni örnekte koruyabiliyorsa ileri inceleme isteğine göre ilerle.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-philo-3",
    "discipline": "philo",
    "project_id": "project-logic-pump",
    "title": "Felsefe: koşuldan sonuca",
    "depth": "ileri",
    "focus": "Eksik kuralı görünür kılma",
    "material": "P→V ve (V ve elektrik yok)→P değil kuralları var. V doğru; elektrik var.",
    "prompt": "P sonucunu zorunlu yapan ek kuralı yaz; yeni kural olmadan iki uyumlu model göster.",
    "worked_solution": "Ek kural (V ve elektrik var)→P olabilir. Bu kural verilmeden V ve elektrik doğru iken P doğru da yanlış da olabilir; mevcut öncüller ikisini de dışlamaz.",
    "reasoning": "Yeni varsayım, eski öncüllerden türetilmiş gibi sunulmaz.",
    "common_error": "Eksik yeterlilik kuralını fark etmeden sonuca geçmek.",
    "prerequisite_unit_id": "depth-philo-2",
    "suggested_stop_rule": "Karşı örnek, veri sınırı ve üretim gerekçesini birlikte kaydet; ek uzunluk tek başına başarı değildir.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-music-1",
    "discipline": "music",
    "project_id": "project-music-meter",
    "title": "Müzik: nabız ve alt bölüm",
    "depth": "basit",
    "focus": "Tek dönüşüm",
    "material": "Dörtlük=60 BPM. Bir dörtlük iki sekizliktir.",
    "prompt": "Dakikada kaç sekizlik vardır?",
    "worked_solution": "60×2=120 sekizlik/dakika.",
    "reasoning": "Dönüşüm verilen nota değerine bağlıdır.",
    "common_error": "BPM sayısını birimsiz bırakmak.",
    "prerequisite_unit_id": null,
    "suggested_stop_rule": "Tek ayrımı yeni bir küçük örnekte koruyabiliyorsa aynı açıklamayı uzatma.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-music-2",
    "discipline": "music",
    "project_id": "project-music-meter",
    "title": "Müzik: nabız ve alt bölüm",
    "depth": "orta",
    "focus": "Aynı sayı, farklı nabız",
    "material": "A: dörtlük=72 BPM. B: noktalı dörtlük=72 BPM.",
    "prompt": "İki sekizlik akışını karşılaştır.",
    "worked_solution": "A:144; B:216 sekizlik/dakika. Noktalı dörtlük üç, dörtlük iki sekizlik içerir.",
    "reasoning": "Karşılaştırma aynı alt bölüm birimine dönüştürülür.",
    "common_error": "İki 72 sayısını aynı sekizlik akışı sanmak.",
    "prerequisite_unit_id": "depth-music-1",
    "suggested_stop_rule": "Koşulu ve gerekçeyi yeni örnekte koruyabiliyorsa ileri inceleme isteğine göre ilerle.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-music-3",
    "discipline": "music",
    "project_id": "project-music-meter",
    "title": "Müzik: nabız ve alt bölüm",
    "depth": "ileri",
    "focus": "Akışı eşitleme ve yapı farkı",
    "material": "A:3/4, dörtlük=90 BPM. B:6/8; B’nin sekizlik akışı A ile aynı olacak.",
    "prompt": "B için noktalı dörtlük BPM değerini ve iki ölçünün süresini bul. Ölçülerin vurgusu da aynı olur mu?",
    "worked_solution": "A akışı 180 sekizlik/dakika. B için 180/3=60 BPM. A ölçüsü 3×60/90=2 saniye, B ölçüsü 2×60/60=2 saniye. Süre ve alt bölüm eşitliği 3×2 ile 2×3 gruplanmasını aynı yapmaz.",
    "reasoning": "Hesap ile ritmik gruplanma ayrı değerlendirilir.",
    "common_error": "Eşit süreyi eşit vurgu düzeni saymak.",
    "prerequisite_unit_id": "depth-music-2",
    "suggested_stop_rule": "Karşı örnek, veri sınırı ve üretim gerekçesini birlikte kaydet; ek uzunluk tek başına başarı değildir.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-diction-1",
    "discipline": "diction",
    "project_id": "project-diction-script",
    "title": "Diksiyon: dinleyicinin doğru anlaması",
    "depth": "basit",
    "focus": "Anlam birimi",
    "material": "B kapısı kapalı; ziyaretçiler A kapısını kullanacak.",
    "prompt": "Duyuruyu iki kısa anlam parçasına ayır.",
    "worked_solution": "B kapısı kapalı. / Ziyaretçiler A kapısını kullanacak.",
    "reasoning": "Durak, durum bilgisini işlem yönlendirmesinden ayırıyor.",
    "common_error": "Sadece yüksek sesli okumayı anlaşılabilirlik kanıtı saymak.",
    "prerequisite_unit_id": null,
    "suggested_stop_rule": "Tek ayrımı yeni bir küçük örnekte koruyabiliyorsa aynı açıklamayı uzatma.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-diction-2",
    "discipline": "diction",
    "project_id": "project-diction-script",
    "title": "Diksiyon: dinleyicinin doğru anlaması",
    "depth": "orta",
    "focus": "Grup ve koşul",
    "material": "Ziyaretçiler A kapısından; personel kartla C kapısından geçebilir.",
    "prompt": "Yanlış anlaşılabilecek bir sürüm yaz ve düzelt.",
    "worked_solution": "Herkes C’den geçebilir ifadesi yanlıştır. Düzeltme: Ziyaretçiler A’yı kullanır. Personel kartıyla C’den geçebilir.",
    "reasoning": "Seslendirmede grup/koşul korunacak şekilde metin düzenlenir.",
    "common_error": "Kart koşulunu vurgu uğruna çıkarmak.",
    "prerequisite_unit_id": "depth-diction-1",
    "suggested_stop_rule": "Koşulu ve gerekçeyi yeni örnekte koruyabiliyorsa ileri inceleme isteğine göre ilerle.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-diction-3",
    "discipline": "diction",
    "project_id": "project-diction-script",
    "title": "Diksiyon: dinleyicinin doğru anlaması",
    "depth": "ileri",
    "focus": "Kayıt karşılaştırmasını sınırlama",
    "material": "A:180 kelime/90 saniye,9 işaretli hata. B:120 kelime/60 saniye,6 hata. Metinler farklı; dinleyici yanıtı yok.",
    "prompt": "Hesapları yap; hangi sonuç ölçülebilir, hangisi açık kalır? Sonraki karşılaştırma için veri tasarla.",
    "worked_solution": "İkisi de 120 kelime/dakika ve%5 işaretli hata. Metinler ve dinleyici verisi farklı/eksik olduğundan genel başarı sıralaması çıkmaz. Aynı görev ve benzer metinle, doğru kapı/koşulun dinleyici tarafından geri aktarılması kaydedilebilir.",
    "reasoning": "Ölçülebilen oran ile anlam aktarımı ayrılır; burada ses kaydı değerlendirilmedi.",
    "common_error": "Eşit sayıdan eşit diksiyon kalitesi sonucu çıkarmak.",
    "prerequisite_unit_id": "depth-diction-2",
    "suggested_stop_rule": "Karşı örnek, veri sınırı ve üretim gerekçesini birlikte kaydet; ek uzunluk tek başına başarı değildir.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-reading-1",
    "discipline": "reading",
    "project_id": "project-reading-evidence",
    "title": "Okuma: iddia ile kanıtın kapsamı",
    "depth": "basit",
    "focus": "Verilen sayıyı koruma",
    "material": "12 kişi yeni rotayı daha rahat bulduğunu belirtti.",
    "prompt": "Kaynağı genişletmeden tek cümle not yaz.",
    "worked_solution": "12 kişi yeni rotayı daha rahat bulduğunu belirtmiş.",
    "reasoning": "Not kaynağın verdiği sayı ve ifadeyi korur.",
    "common_error": "12 kişi yerine herkes yazmak.",
    "prerequisite_unit_id": null,
    "suggested_stop_rule": "Tek ayrımı yeni bir küçük örnekte koruyabiliyorsa aynı açıklamayı uzatma.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-reading-2",
    "discipline": "reading",
    "project_id": "project-reading-evidence",
    "title": "Okuma: iddia ile kanıtın kapsamı",
    "depth": "orta",
    "focus": "Eksik paydayı bulma",
    "material": "12 kişi yeni rotayı daha rahat buldu; toplam ve seçim yöntemi bilinmiyor.",
    "prompt": "Çoğunluk beğendi notunu neden kullanamazsın?",
    "worked_solution": "Çoğunluk için toplam gerekir; ayrıca rahat bulma ile beğenme aynı ifade değildir.",
    "reasoning": "Hem sayı kapsamı hem ölçüm anlamı incelenir.",
    "common_error": "Yalnız paydayı düzeltip beğenme ifadesini kontrol etmemek.",
    "prerequisite_unit_id": "depth-reading-1",
    "suggested_stop_rule": "Koşulu ve gerekçeyi yeni örnekte koruyabiliyorsa ileri inceleme isteğine göre ilerle.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-reading-3",
    "discipline": "reading",
    "project_id": "project-reading-evidence",
    "title": "Okuma: iddia ile kanıtın kapsamı",
    "depth": "ileri",
    "focus": "Aynı başlık altındaki farklı ölçümler",
    "material": "A araştırması: gönüllü 20 yanıtın 12’si daha rahat diyor. B kaydı: farklı bölgede rastgele seçilmiş 30 kişinin 18’i daha ucuz diyor.",
    "prompt": "Bu sonuçları tek bir yüzde 60 memnuniyet bulgusu olarak birleştirmek uygun mu? Ayrı sonuçları yaz.",
    "worked_solution": "Her iki oran%60 olsa da soru, örnekleme ve bölge farklıdır. A için gönüllü yanıtlayanların 12/20’si daha rahat; B için kendi örneklemindeki 18/30 kişi daha ucuz demiştir. Tek memnuniyet ölçümü oluşmaz.",
    "reasoning": "Oranların aritmetik eşitliği ölçüm eşdeğerliği değildir.",
    "common_error": "Paydaları bilmenin bütün karşılaştırma sorunlarını çözdüğünü varsaymak.",
    "prerequisite_unit_id": "depth-reading-2",
    "suggested_stop_rule": "Karşı örnek, veri sınırı ve üretim gerekçesini birlikte kaydet; ek uzunluk tek başına başarı değildir.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-writing-1",
    "discipline": "writing",
    "project_id": "project-writing-version",
    "title": "Yazma: işlevli revizyon",
    "depth": "basit",
    "focus": "Koşulu kaybetmeden kısaltma",
    "material": "Talebin yeterli olması durumunda bir akşam seferi eklenmesini öneriyorum.",
    "prompt": "Anlamı koruyarak kısalt.",
    "worked_solution": "Talep yeterliyse bir akşam seferi ekleyelim.",
    "reasoning": "Koşul, miktar ve öneri niteliği korunur.",
    "common_error": "Bir sözcüğünü silerek sefer sayısını belirsizleştirmek.",
    "prerequisite_unit_id": null,
    "suggested_stop_rule": "Tek ayrımı yeni bir küçük örnekte koruyabiliyorsa aynı açıklamayı uzatma.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-writing-2",
    "discipline": "writing",
    "project_id": "project-writing-version",
    "title": "Yazma: işlevli revizyon",
    "depth": "orta",
    "focus": "Gerekçe ekleme",
    "material": "Talep yeterliyse bir akşam seferi ekleyelim. İtiraz: Ek maliyet bilinmiyor.",
    "prompt": "İtirazı ele alan bir cümle ekle.",
    "worked_solution": "Karardan önce ek sefer giderini ve beklenen yolcu sayısını birlikte inceleyelim.",
    "reasoning": "İtiraza yanıt için araştırılacak bilgi tanımlanır; maliyet uydurulmaz.",
    "common_error": "Maliyet düşüktür diye veri olmadan güvence vermek.",
    "prerequisite_unit_id": "depth-writing-1",
    "suggested_stop_rule": "Koşulu ve gerekçeyi yeni örnekte koruyabiliyorsa ileri inceleme isteğine göre ilerle.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-writing-3",
    "discipline": "writing",
    "project_id": "project-writing-version",
    "title": "Yazma: işlevli revizyon",
    "depth": "ileri",
    "focus": "Tür ve karar ihtiyacı",
    "material": "Üç görüşmede akşam bekleme sorunu bildirilmiş. Toplam talep ve maliyet bilinmiyor.",
    "prompt": "Karar verici için iki cümle rapor, kişisel deneme için iki cümle taslak yaz; ortak veri sınırını açıkla.",
    "worked_solution": "Rapor: Üç görüşmede akşam bekleme sorunu bildirildi. Talep ve maliyet ölçülmeden sefer kararı için kanıt sınırlı. Deneme: Bu üç anlatı bana beklemenin günlük hayatı nasıl etkilediğini düşündürüyor. Bu yorum, bütün mahalle adına konuştuğum anlamına gelmiyor.",
    "reasoning": "Tür değişirken veri ve yorum sınırı korunur; kurgusal deneyim gerçek görüşme gibi eklenmez.",
    "common_error": "Denemeyi serbest tür sayıp veri uydurmak.",
    "prerequisite_unit_id": "depth-writing-2",
    "suggested_stop_rule": "Karşı örnek, veri sınırı ve üretim gerekçesini birlikte kaydet; ek uzunluk tek başına başarı değildir.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-history-1",
    "discipline": "history",
    "project_id": "project-history-doc",
    "title": "Tarih: belge, ölçüm ve açıklama",
    "depth": "basit",
    "focus": "İki tarihi ayırma",
    "material": "1905 tarihli belge 1903 olayını anlatıyor.",
    "prompt": "Olay ve belge tarihini ayrı yaz.",
    "worked_solution": "Olay:1903. Belge üretimi:1905.",
    "reasoning": "Tarihler farklı alanlara aittir.",
    "common_error": "Belge tarihini doğrudan olay tarihi yapmak.",
    "prerequisite_unit_id": null,
    "suggested_stop_rule": "Tek ayrımı yeni bir küçük örnekte koruyabiliyorsa aynı açıklamayı uzatma.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-history-2",
    "discipline": "history",
    "project_id": "project-history-doc",
    "title": "Tarih: belge, ölçüm ve açıklama",
    "depth": "orta",
    "focus": "Kaynak sayısı ile bağımsızlık",
    "material": "A 1905 belgesi; B 1930’da A’nın kopyası; C 1904’te farklı üreticinin belgesi.",
    "prompt": "Bağımsız tanıklık sayısını kesin verebilir misin?",
    "worked_solution": "A ve B aynı aktarım zincirindedir. C’nin farklı üreticisi bağımsızlık için aday gerekçedir; ortak kaynak kullanıp kullanmadığı bilinmeden kesin sayı verilemez.",
    "reasoning": "Kopyalama ilişkisi bilinir; C’nin bağımsızlığı ayrıca araştırılır.",
    "common_error": "Farklı isimli yazarı otomatik bağımsız saymak.",
    "prerequisite_unit_id": "depth-history-1",
    "suggested_stop_rule": "Koşulu ve gerekçeyi yeni örnekte koruyabiliyorsa ileri inceleme isteğine göre ilerle.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  },
  {
    "id": "depth-history-3",
    "discipline": "history",
    "project_id": "project-history-doc",
    "title": "Tarih: belge, ölçüm ve açıklama",
    "depth": "ileri",
    "focus": "Nedensellik için veri uygunluğu",
    "material": "1910:2000 hane;1920:3000 kişi. Bu dönemde yol açılmış.",
    "prompt": "Yol nüfusu%50 artırdı iddiası için iki ayrı sorun ve araştırma planı yaz.",
    "worked_solution": "Birimler uyumsuz olduğundan%50 hesabı desteklenmez. Yol ile nüfus arasında zaman ilişkisi tek neden kanıtı değildir. Önce aynı coğrafya ve birimde sayımları bul; sonra göç, sınır değişimi ve yolun ulaşım etkisi için kaynakları karşılaştır.",
    "reasoning": "Birim düzeltmesi tek başına nedensellik kanıtı üretmez.",
    "common_error": "Ortalama hane büyüklüğünü kanıt olmadan varsaymak.",
    "prerequisite_unit_id": "depth-history-2",
    "suggested_stop_rule": "Karşı örnek, veri sınırı ve üretim gerekçesini birlikte kaydet; ek uzunluk tek başına başarı değildir.",
    "difficulty_status": "Editörün görev karmaşıklığı tasarımı; öğrenci üzerinde ölçülmedi, CEFR eşlemesi yok.",
    "origin": "Özgün kurgusal öğretim örneği.",
    "ready_for_app": false
  }
];
