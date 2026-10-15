/* ESP Değerlendirme Rubrikleri (7 Rubrik, 22 Boyut), Derin Analizler (7 Alan) ve Kademeli Geri Bildirim
   Kaynak: esp-profesyonel-v4 & esp-veriseti */

window.ESP = window.ESP || {};

ESP.RUBRIKLER = [
  {
    "id": "rubric-lang",
    "discipline": "lang",
    "status": "editör_taslağı",
    "validated": false,
    "score_scale": [
      0,
      1,
      2,
      3
    ],
    "missing_value": null,
    "rule": "Yalnız sorunun istediği ve yanıtta gözlenebilir boyutu puanla. Yanıt yoksa veya boyut görevde ölçülmüyorsa null ve neden yaz. Sayılar kişi özelliği veya sertifika değildir; toplam puan ve geçme eşiği tanımlanmadı.",
    "dimensions": [
      {
        "id": "rubric-lang-d1",
        "name": "Anlam",
        "anchors": [
          {
            "score": 0,
            "description": "Kişi, işlem veya zamanı kaynakla çelişir."
          },
          {
            "score": 1,
            "description": "İşlemi doğru verir; belirleyici koşulu eksiktir."
          },
          {
            "score": 2,
            "description": "Kişi, işlem ve zamanı korur."
          },
          {
            "score": 3,
            "description": "Kişi, işlem ve zamanı korur; bütün işlem koşullarını, kaynakta varsa belirsizliği de dinleyiciye uygun aktarır."
          }
        ]
      },
      {
        "id": "rubric-lang-d2",
        "name": "İfade",
        "anchors": [
          {
            "score": 0,
            "description": "Mesajın temel amacı anlaşılamaz."
          },
          {
            "score": 1,
            "description": "Amaç anlaşılır; yanlış yönlendirebilecek ifade vardır."
          },
          {
            "score": 2,
            "description": "İfade amacı anlaşılır biçimde taşır."
          },
          {
            "score": 3,
            "description": "İfade dinleyiciye göre uyarlanır; kaynak anlamı korunur."
          }
        ]
      },
      {
        "id": "rubric-lang-d3",
        "name": "Dayanak",
        "anchors": [
          {
            "score": 0,
            "description": "Kaynakta olmayan bilgiyi kesin ekler."
          },
          {
            "score": 1,
            "description": "Kaynağa atıf yapar; dayanak konumu belirsizdir."
          },
          {
            "score": 2,
            "description": "Yorumunu kaynak ifadesine bağlar."
          },
          {
            "score": 3,
            "description": "Kaynak ifadesi, yorum ve eksik bilgiyi açık ayırır."
          }
        ]
      }
    ]
  },
  {
    "id": "rubric-philo",
    "discipline": "philo",
    "status": "editör_taslağı",
    "validated": false,
    "score_scale": [
      0,
      1,
      2,
      3
    ],
    "missing_value": null,
    "rule": "Yalnız sorunun istediği ve yanıtta gözlenebilir boyutu puanla. Yanıt yoksa veya boyut görevde ölçülmüyorsa null ve neden yaz. Sayılar kişi özelliği veya sertifika değildir; toplam puan ve geçme eşiği tanımlanmadı.",
    "dimensions": [
      {
        "id": "rubric-philo-d1",
        "name": "Çıkarım",
        "anchors": [
          {
            "score": 0,
            "description": "Öncüllerin izin vermediği zorunlu sonuç çıkarır."
          },
          {
            "score": 1,
            "description": "Sonucu doğru seçer; gerekçe eksiktir."
          },
          {
            "score": 2,
            "description": "Öncül ile sonuç arasındaki bağı açıklar."
          },
          {
            "score": 3,
            "description": "Bağı ve geçerlilik sınırını bir karşı örnekle sınar."
          }
        ]
      },
      {
        "id": "rubric-philo-d2",
        "name": "Kavramsal ayrım",
        "anchors": [
          {
            "score": 0,
            "description": "Gerekli ile yeterli koşulu veya olgu ile değeri birleştirir."
          },
          {
            "score": 1,
            "description": "Ayrımı adlandırır; uygulaması eksiktir."
          },
          {
            "score": 2,
            "description": "Örnekte hangi koşul veya değer kullanıldığını gösterir."
          },
          {
            "score": 3,
            "description": "Alternatif koşul veya değerin sonucu nasıl değiştirdiğini gösterir."
          }
        ]
      },
      {
        "id": "rubric-philo-d3",
        "name": "İtiraz",
        "anchors": [
          {
            "score": 0,
            "description": "Rakip görüşe metinde olmayan iddia yükler."
          },
          {
            "score": 1,
            "description": "İtirazı belirtir ama yanıtlamaz."
          },
          {
            "score": 2,
            "description": "İtirazı adil aktarır ve gerekçeli yanıt verir."
          },
          {
            "score": 3,
            "description": "Yanıtın hangi ek varsayımla geçerli olduğunu açıklar."
          }
        ]
      }
    ]
  },
  {
    "id": "rubric-music",
    "discipline": "music",
    "status": "editör_taslağı",
    "validated": false,
    "score_scale": [
      0,
      1,
      2,
      3
    ],
    "missing_value": null,
    "rule": "Yalnız sorunun istediği ve yanıtta gözlenebilir boyutu puanla. Yanıt yoksa veya boyut görevde ölçülmüyorsa null ve neden yaz. Sayılar kişi özelliği veya sertifika değildir; toplam puan ve geçme eşiği tanımlanmadı.",
    "dimensions": [
      {
        "id": "rubric-music-d1",
        "name": "Birim",
        "anchors": [
          {
            "score": 0,
            "description": "Nabız nota değerini yanlış kullanır."
          },
          {
            "score": 1,
            "description": "Doğru sonucu verir ama sayılan birim görünmez."
          },
          {
            "score": 2,
            "description": "Nabız, alt bölüm ve ölçü birimlerini doğru gösterir."
          },
          {
            "score": 3,
            "description": "Birim dönüşümünü açıklar ve farklı ölçüyle karşılaştırır."
          }
        ]
      },
      {
        "id": "rubric-music-d2",
        "name": "Hesap",
        "anchors": [
          {
            "score": 0,
            "description": "İşlem veya sonuç verilen sayılarla çelişir."
          },
          {
            "score": 1,
            "description": "İşlem mantığı doğru; yerel hesap hatası vardır."
          },
          {
            "score": 2,
            "description": "İşlem ve sonuç doğrudur."
          },
          {
            "score": 3,
            "description": "İşlem, sonuç ve yuvarlama gerekçesi denetlenebilirdir."
          }
        ]
      },
      {
        "id": "rubric-music-d3",
        "name": "Müzikal yorum",
        "anchors": [
          {
            "score": 0,
            "description": "Sayı eşitliğini ritmik yapı eşitliği sayar."
          },
          {
            "score": 1,
            "description": "Farkı belirtir; müzikal karşılığı belirsizdir."
          },
          {
            "score": 2,
            "description": "Bölümleme farkını örneğe bağlar."
          },
          {
            "score": 3,
            "description": "Aynı BPM ile farklı akışın nedenini ve bağlam sınırını açıklar."
          }
        ]
      },
      {
        "id": "rubric-music-d4",
        "name": "Kaynak ve temsil",
        "anchors": [
          {
            "score": 0,
            "description": "Katalog, nota, MIDI veya perde sınıfını birbirinin doğrulanmış eşdeğeri sayar."
          },
          {
            "score": 1,
            "description": "Temsil veya kaynak farkını adlandırır; eksik alanları göstermez."
          },
          {
            "score": 2,
            "description": "Eser/baskı, lisans, çalgı ve temsil türünü görevle ilişkili biçimde ayırır."
          },
          {
            "score": 3,
            "description": "Kullanılacak belirli dosya için eksik bilgiyi, doğrulama adımını ve karar sınırını açıklar."
          }
        ]
      }
    ]
  },
  {
    "id": "rubric-diction",
    "discipline": "diction",
    "status": "editör_taslağı",
    "validated": false,
    "score_scale": [
      0,
      1,
      2,
      3
    ],
    "missing_value": null,
    "rule": "Yalnız sorunun istediği ve yanıtta gözlenebilir boyutu puanla. Yanıt yoksa veya boyut görevde ölçülmüyorsa null ve neden yaz. Sayılar kişi özelliği veya sertifika değildir; toplam puan ve geçme eşiği tanımlanmadı.",
    "dimensions": [
      {
        "id": "rubric-diction-d1",
        "name": "Anlam aktarımı",
        "anchors": [
          {
            "score": 0,
            "description": "Dinleyiciyi yanlış işleme yönlendirir."
          },
          {
            "score": 1,
            "description": "Ana işlem anlaşılır; grup veya koşul eksiktir."
          },
          {
            "score": 2,
            "description": "Grup, işlem ve koşul korunur."
          },
          {
            "score": 3,
            "description": "Dinleyicinin bu bilgiyi nasıl geri aktaracağı da sınanır."
          }
        ]
      },
      {
        "id": "rubric-diction-d2",
        "name": "Sunum gerekçesi",
        "anchors": [
          {
            "score": 0,
            "description": "Vurgu/durak seçimi anlamı bozar."
          },
          {
            "score": 1,
            "description": "Bir seçim önerir ama anlamla ilişkisi açık değildir."
          },
          {
            "score": 2,
            "description": "Vurgu/durağı anlam birimine bağlar."
          },
          {
            "score": 3,
            "description": "İki seçeneği hedef dinleyici bakımından gerekçeli karşılaştırır."
          }
        ]
      },
      {
        "id": "rubric-diction-d3",
        "name": "Ölçüm yorumu",
        "anchors": [
          {
            "score": 0,
            "description": "Öz değerlendirmeyi bağımsız ses analizi diye sunar."
          },
          {
            "score": 1,
            "description": "Kaynağı belirtir; görev farklarını atlar."
          },
          {
            "score": 2,
            "description": "Beyan, hesap ve kayıt koşullarını ayırır."
          },
          {
            "score": 3,
            "description": "Karşılaştırmanın hangi koşullarda geçerli olduğunu açıklar."
          }
        ]
      }
    ]
  },
  {
    "id": "rubric-reading",
    "discipline": "reading",
    "status": "editör_taslağı",
    "validated": false,
    "score_scale": [
      0,
      1,
      2,
      3
    ],
    "missing_value": null,
    "rule": "Yalnız sorunun istediği ve yanıtta gözlenebilir boyutu puanla. Yanıt yoksa veya boyut görevde ölçülmüyorsa null ve neden yaz. Sayılar kişi özelliği veya sertifika değildir; toplam puan ve geçme eşiği tanımlanmadı.",
    "dimensions": [
      {
        "id": "rubric-reading-d1",
        "name": "Metne sadakat",
        "anchors": [
          {
            "score": 0,
            "description": "Metindeki sayı veya kapsamı değiştirir."
          },
          {
            "score": 1,
            "description": "Ana fikri yakalar; önemli sınır eksiktir."
          },
          {
            "score": 2,
            "description": "Verilen bilgiyi kapsamıyla korur."
          },
          {
            "score": 3,
            "description": "Verilen ve verilmeyen bilgiyi ayrı gösterir."
          }
        ]
      },
      {
        "id": "rubric-reading-d2",
        "name": "Kanıt",
        "anchors": [
          {
            "score": 0,
            "description": "Dayanak göstermeden kesin sonuca gider."
          },
          {
            "score": 1,
            "description": "Alıntı verir ama iddiayla bağını açıklamaz."
          },
          {
            "score": 2,
            "description": "İddiasını ilgili metin parçasına bağlar."
          },
          {
            "score": 3,
            "description": "Parçanın desteklediği ve desteklemediği sonuçları ayırır."
          }
        ]
      },
      {
        "id": "rubric-reading-d3",
        "name": "Sentez",
        "anchors": [
          {
            "score": 0,
            "description": "Farklı metinleri zorunlu karşıt sayar."
          },
          {
            "score": 1,
            "description": "Benzerlik/farkı listeler; ortak soru yoktur."
          },
          {
            "score": 2,
            "description": "Metinleri ortak soruda karşılaştırır."
          },
          {
            "score": 3,
            "description": "Uzlaşma, gerilim ve açık soruları birlikte görünür kılar."
          }
        ]
      }
    ]
  },
  {
    "id": "rubric-writing",
    "discipline": "writing",
    "status": "editör_taslağı",
    "validated": false,
    "score_scale": [
      0,
      1,
      2,
      3
    ],
    "missing_value": null,
    "rule": "Yalnız sorunun istediği ve yanıtta gözlenebilir boyutu puanla. Yanıt yoksa veya boyut görevde ölçülmüyorsa null ve neden yaz. Sayılar kişi özelliği veya sertifika değildir; toplam puan ve geçme eşiği tanımlanmadı.",
    "dimensions": [
      {
        "id": "rubric-writing-d1",
        "name": "Kapsam",
        "anchors": [
          {
            "score": 0,
            "description": "Kaynağı aşan genellemeyi gerçek gibi yazar."
          },
          {
            "score": 1,
            "description": "Genellemeyi daraltır; sınır hâlâ belirsizdir."
          },
          {
            "score": 2,
            "description": "İddiayı kaynak ve koşul sınırında tutar."
          },
          {
            "score": 3,
            "description": "Koşulu okurun yanlış yorumlamayacağı açıklıkta kurar."
          }
        ]
      },
      {
        "id": "rubric-writing-d2",
        "name": "Gerekçe",
        "anchors": [
          {
            "score": 0,
            "description": "Metin amacıyla ilgisiz ekleme veya silme yapar."
          },
          {
            "score": 1,
            "description": "Değişikliği adlandırır; işlevini açıklamaz."
          },
          {
            "score": 2,
            "description": "Değişikliğin açıklama veya itiraz işlevini gösterir."
          },
          {
            "score": 3,
            "description": "Kazancı ve olası anlam kaybını eski/yeni metinle karşılaştırır."
          }
        ]
      },
      {
        "id": "rubric-writing-d3",
        "name": "Tür ve okur",
        "anchors": [
          {
            "score": 0,
            "description": "Tür veya okur için gerekli bilgi eksiktir."
          },
          {
            "score": 1,
            "description": "Tür uygun; okurun ihtiyaçları kısmen karşılanır."
          },
          {
            "score": 2,
            "description": "Bilgiyi tür ve okur amacına göre düzenler."
          },
          {
            "score": 3,
            "description": "Üslubu uyarlarken veri, kişisel yorum ve bilinmeyeni ayırır."
          }
        ]
      }
    ]
  },
  {
    "id": "rubric-history",
    "discipline": "history",
    "status": "editör_taslağı",
    "validated": false,
    "score_scale": [
      0,
      1,
      2,
      3
    ],
    "missing_value": null,
    "rule": "Yalnız sorunun istediği ve yanıtta gözlenebilir boyutu puanla. Yanıt yoksa veya boyut görevde ölçülmüyorsa null ve neden yaz. Sayılar kişi özelliği veya sertifika değildir; toplam puan ve geçme eşiği tanımlanmadı.",
    "dimensions": [
      {
        "id": "rubric-history-d1",
        "name": "Zaman ve birim",
        "anchors": [
          {
            "score": 0,
            "description": "Olay/belge tarihlerini veya hane/kişi birimini birleştirir."
          },
          {
            "score": 1,
            "description": "Ayrımı söyler; bir alanı yanlış yerleştirir."
          },
          {
            "score": 2,
            "description": "Zaman ve birim alanlarını doğru ayırır."
          },
          {
            "score": 3,
            "description": "Uyumsuz alanın hangi sonucu engellediğini açıklar."
          }
        ]
      },
      {
        "id": "rubric-history-d2",
        "name": "Kaynak ilişkisi",
        "anchors": [
          {
            "score": 0,
            "description": "Kopyaları bağımsız tanıklık sayar."
          },
          {
            "score": 1,
            "description": "Aktarım bağını fark eder; sonuç kapsamını atlar."
          },
          {
            "score": 2,
            "description": "Kopyalama ve farklı üretici bilgisini ayrı değerlendirir."
          },
          {
            "score": 3,
            "description": "Bağımsızlık ve doğruluğun ayrı inceleme gerektirdiğini gösterir."
          }
        ]
      },
      {
        "id": "rubric-history-d3",
        "name": "Neden",
        "anchors": [
          {
            "score": 0,
            "description": "Zaman sırasını tek neden kanıtı sayar."
          },
          {
            "score": 1,
            "description": "Alternatiften söz eder; sınanabilir soru yoktur."
          },
          {
            "score": 2,
            "description": "Mekanizma ve alternatif etken için soru kurar."
          },
          {
            "score": 3,
            "description": "Soruyu uygun birim, dönem, kaynak ve karşılaştırmayla sınırlar."
          }
        ]
      }
    ]
  }
];

ESP.RUBRIK_BY_DISC = (function(){
  const m = {};
  ESP.RUBRIKLER.forEach(r => { m[r.discipline] = r; });
  return m;
})();

ESP.DERIN_ANALIZLER = [
  {
    "id": "deep-lang",
    "discipline": "lang",
    "title": "Dil: tanıma, hatırlama ve üretimi ayırmak",
    "problem": "Karttaki sözcüğü tanıyan kullanıcı bunu konuşmada da kullanabildiğini varsayıyor.",
    "analysis": "Bir kartın doğru karşılığını seçme, cevabı ipucusuz geri getirme ve yeni cümlede kullanma farklı görevlerdir. Kaynak derlem cümlesi gerçek kullanım örneği olabilir; bu, kullanıcının o örneği anladığı veya aynı dil düzeyinde olduğu anlamına gelmez.",
    "cases": [
      {
        "situation": "Çoktan seçmeli yanıtta doğru, boş alanda cevap yok.",
        "interpretation": "Tanıma başarısı var; ipucusuz geri getirme için veri eksik.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Ezberlenen cümle söyleniyor ama kişi/zaman değişince yapı bozuluyor.",
        "interpretation": "Aynı örneğin tekrarıyla yeni bağlama aktarım ayrı tutulmalı.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "UD etiketi var fakat Türkçe çevirisi ve CEFR düzeyi yok.",
        "interpretation": "Dilbilimsel etiket, çeviri doğruluğu veya pedagojik seviye sertifikası değildir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      }
    ],
    "decision": [
      "Görev türünü belirt.",
      "İpucu ve yardım koşullarını kaydet.",
      "Yeni bağlamda üretim iste.",
      "Eksik örneği yanlış cevap veya sıfır performans sayma."
    ],
    "counterexample": "Daha çok kart tanımak, yeni konuşma görevinde daha az yardım kullanıldığını tek başına göstermez.",
    "expected_output": "Yeni örnekte seçilen yapı, anlam ve bağlamı açıklayan üretim kaydı.",
    "source_ids": [
      "cefr",
      "ud"
    ],
    "review_status": "Özgün öğretim taslağı; alan uzmanı ve kullanıcı öğrenme testi bekliyor.",
    "ready_for_app": false
  },
  {
    "id": "deep-philo",
    "discipline": "philo",
    "title": "Felsefe: güçlü görünen savı çözümlemek",
    "problem": "Öğrenci savı akıcı biçimde tekrar ediyor fakat gerekçeyi ve itirazı ayıramıyor.",
    "analysis": "Önce savın hangi sonucu kabul ettirmek istediğini çıkar. Sonra destekleyici öncülleri, tanımları ve aradaki bağlantıyı yaz. Tartışmanın kapsamını belirtmeden bir örneği genel kanıt yapma. Karşı görüşü en zayıf haliyle sunmak değerlendirmeyi kolaylaştırabilir ama düşünsel sınamayı zayıflatır.",
    "cases": [
      {
        "situation": "Sonuç kabul ediliyor, öncüller belirtilmiyor.",
        "interpretation": "Görüş beyanı var; argüman yapısı henüz gösterilmemiş.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Bir karşı örnek ortaya çıkınca tanım değiştirilip değişiklik söylenmiyor.",
        "interpretation": "Tanım değişikliği kayıtlı değilse tartışmanın konusu sessizce değişmiştir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Bir yazarın özeti özgün metin alıntısı diye sunuluyor.",
        "interpretation": "Özet ile yazarın kendi sözleri kaynak türüyle ayrılmalı.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      }
    ],
    "decision": [
      "Tezi yaz.",
      "Öncül ve kavramları ayır.",
      "Güçlü itirazı kur.",
      "Yanıtın kapsamını ve açık kalan soruyu belirt."
    ],
    "counterexample": "Sonuç doğru olabilir ama sunulan gerekçe onu desteklemeyebilir.",
    "expected_output": "Tez, öncül, itiraz ve gerekçeli yanıt içeren kısa çözümleme.",
    "source_ids": [
      "sep-logic"
    ],
    "review_status": "Özgün öğretim taslağı; alan uzmanı ve kullanıcı öğrenme testi bekliyor.",
    "ready_for_app": false
  },
  {
    "id": "deep-music",
    "discipline": "music",
    "title": "Müzik: hızlı çalmak ile tutarlı icrayı ayırmak",
    "problem": "BPM yükselince gelişimin bütün boyutları arttı sanılıyor.",
    "analysis": "Tempo, çalınan bölüm, ritmik alt bölme ve hata tanımı birlikte kaydedilir. Metronomun neyi saydığı belli değilse iki BPM sayısı aynı görev olmayabilir. Gamın perde sınıflarını bilmek nota yazımını veya temiz ses üretimini kendiliğinden doğrulamaz. Çalışılmış pasaj ile eserin tüm icrası ayrı ölçüm bağlamıdır.",
    "cases": [
      {
        "situation": "Aynı pasaj 80 ve 90 BPM kaydedilmiş; ikinci kayıtta notalar atlanmış.",
        "interpretation": "Hız ve doğruluk birlikte raporlanır; atlama görünmez bırakılmaz.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "6/8 ölçüde biri sekizlik, diğeri noktalı dörtlük nabzını sayıyor.",
        "interpretation": "Nabız birimi tanımlanmadan sayılar doğrudan karşılaştırılmaz.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Perde sınıfı doğru fakat F majörde A diyez yazılmış.",
        "interpretation": "Enharmonik ses eşliği, tonal nota adlandırmasını doğru yapmaz.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      }
    ],
    "decision": [
      "Pasaj ve nabız birimini tanımla.",
      "Akort ve kayıt koşullarını belirt.",
      "Hata türlerini ayrı kaydet.",
      "Yeni tempoda aynı görev standardını kontrol et."
    ],
    "counterexample": "Daha yavaş bir kayıt aynı notaları daha tutarlı gösterebilir; yalnız BPM grafiği yeterli değildir.",
    "expected_output": "Pasaj, nabız birimi, tempo ve gözlenen hata türleriyle kayıt.",
    "source_ids": [
      "omt-scales",
      "omt-meter"
    ],
    "review_status": "Özgün öğretim taslağı; alan uzmanı ve kullanıcı öğrenme testi bekliyor.",
    "ready_for_app": false
  },
  {
    "id": "deep-diction",
    "discipline": "diction",
    "title": "Diksiyon: hız, anlaşılabilirlik ve ses rahatlığı",
    "problem": "Kelimeler daha hızlı okununca seslendirme bütünüyle daha iyi sayılıyor.",
    "analysis": "Kayıt koşulları sabit tutulmadan ses şiddeti veya tını değişimi kişisel gelişime bağlanmaz. Hata tanımı, durakların sayım biçimi ve dinleyici görevi belirtilir. Rahatsızlık veya kısıklıkta çalışmayı zorlamak içerik hedefi haline getirilmez; veri seti terapi veya tıbbi teşhis üretmez.",
    "cases": [
      {
        "situation": "Metin daha hızlı okunmuş, anlamı taşıyan duraklar silinmiş.",
        "interpretation": "Hız artışı ayrı; anlam aktarımı için yeni değerlendirme gerekir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Yeni mikrofonla kayıt daha parlak duyuluyor.",
        "interpretation": "Cihaz farkı kayıt koşulu olarak gösterilir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Nefes süresi artmış ama kullanıcı zorlanma bildiriyor.",
        "interpretation": "Uzun süre tek başarı ölçütü yapılmaz; zorlanma gözlemi korunur.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      }
    ],
    "decision": [
      "Metni ve konuşma görevini belirle.",
      "Mikrofon/mesafe/ortamı kaydet.",
      "Hata ve anlam birimlerini ayrı gözle.",
      "Rahatlık sınırını sayısal yarışa çevirmeden incele."
    ],
    "counterexample": "Daha kısa cümle veya daha düşük hız bazı görevlerde açıklığı artırabilir; tek evrensel ideal yoktur.",
    "expected_output": "Kayıt, kullanılan metin, hata tanımı ve dinleyiciye göre açıklama.",
    "source_ids": [
      "nidcd"
    ],
    "review_status": "Özgün öğretim taslağı; alan uzmanı ve kullanıcı öğrenme testi bekliyor.",
    "ready_for_app": false
  },
  {
    "id": "deep-reading",
    "discipline": "reading",
    "title": "Okuma: not sayısından açıklama gücüne geçmek",
    "problem": "Not sayısı arttıkça kitabın anlaşıldığı varsayılıyor.",
    "analysis": "Bir not kaynak iddiasını, yazarın gerekçesini ve okuyucunun yorumunu ayırmalıdır. Kavram bağı yalnız ortak kelimeye değil belirtilen ilişkiye dayanır. Kitap kataloğu kaydı metnin okunması veya kullanılan baskının doğrulanması değildir. Başlıklar üzerinden gözden geçirme notu geçici yorum olarak korunur.",
    "cases": [
      {
        "situation": "Yirmi not aynı alıntıyı farklı cümlelerle tekrar ediyor.",
        "interpretation": "Not hacmi artmış; yeni açıklama/ilişki katkısı ayrı denetlenir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "İki notta özgürlük var ama farklı kavram ölçütleri kullanılıyor.",
        "interpretation": "Ortak sözcük kavram eşitliğini kanıtlamaz.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Bir kitaba katalogdan yazar ve tarih eklenmiş, baskı incelenmemiş.",
        "interpretation": "Katalog metaverisi ile kullanılan baskı ayrı kimliktir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      }
    ],
    "decision": [
      "Okuma sorusunu yaz.",
      "İddiayı gerekçe ve konumuyla kaydet.",
      "Kendi yorumunu ayrı etiketle.",
      "Karşılaştırmada ilişki türünü belirt."
    ],
    "counterexample": "Az sayıda kaynaklı, karşılaştırılabilir not çok sayıda tekrar nottan daha açıklayıcı olabilir; otomatik üstünlük puanı verilmez.",
    "expected_output": "Kaynak konumlu not, açıklanmış kavram bağı ve karşılaştırma sorusu.",
    "source_ids": [
      "purdue",
      "openlibrary"
    ],
    "review_status": "Özgün öğretim taslağı; alan uzmanı ve kullanıcı öğrenme testi bekliyor.",
    "ready_for_app": false
  },
  {
    "id": "deep-writing",
    "discipline": "writing",
    "title": "Yazı: okunabilirlik puanı ile metin niteliğini ayırmak",
    "problem": "Cümleler kısalınca metnin savı ve doğruluğu da iyileşti sanılıyor.",
    "analysis": "Önce amaç, okur ve ana iddia belirlenir. İçerik revizyonu, düzen ve dil düzeltmesi farklı çalışma geçişleri olarak tutulur. Hece/cümle uzunluğuna dayanan bir formül metnin olgusal doğruluğunu, özgünlüğünü veya ikna gücünü doğrudan ölçmez. Bu sınır mevcut ESP kanıt açıklamasında da belirtilmiştir.",
    "cases": [
      {
        "situation": "Cümleler kısaltılmış ama hangi nesneye gönderme yapıldığı belirsizleşmiş.",
        "interpretation": "Kısalma ile gönderim açıklığı ayrı değerlendirilir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Yazım hataları silinmiş ama kanıt hâlâ tek örnekten ibaret.",
        "interpretation": "Dil düzeltmesi içerik gerekçesini tamamlamamış.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Taslak uzamış ve yeni itirazı yanıtlıyor.",
        "interpretation": "Kelime artışı yeni işlev getiriyorsa yalnız uzunluk cezasıyla yorumlanmaz.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      }
    ],
    "decision": [
      "Amaç ve iddiayı belirle.",
      "Kanıt kapsamını kontrol et.",
      "Bölüm işlevlerini gözden geçir.",
      "Dil düzeltmesinden sonra anlamı yeniden oku."
    ],
    "counterexample": "Uzun ama gerekçesi açık bir cümle, kısa fakat belirsiz cümleden bu görevde daha açıklayıcı olabilir.",
    "expected_output": "Önce/sonra taslak ve her değişikliğin gerekçesi.",
    "source_ids": [
      "purdue"
    ],
    "review_status": "Özgün öğretim taslağı; alan uzmanı ve kullanıcı öğrenme testi bekliyor.",
    "ready_for_app": false
  },
  {
    "id": "deep-history",
    "discipline": "history",
    "title": "Tarih: zaman sırası, belge ve neden zinciri",
    "problem": "Olayların tarihlerinin sıralanması nedensel açıklama sanılıyor.",
    "analysis": "Olay tarihi, belge üretim tarihi, takvim ve yaklaşık olma durumu ayrı tutulur. Birincil kaynağın amacı, üreticisi ve muhatabı değerlendirilir. Belgenin döneme ait olması bütün iddialarını doğru yapmaz. Dönem sınırları ve modern kavramlarla yapılan sınıflandırmalar yorum olarak görünür tutulmalıdır.",
    "cases": [
      {
        "situation": "Belge 1910 tarihli ama anlattığı olay 1908.",
        "interpretation": "Olay ve belge tarihi ayrı çizgilerdir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Bir düzenlemeden sonra değişim var; aynı dönemde başka koşullar da değişmiş.",
        "interpretation": "Önce/sonra ilişkisi alternatif açıklamaları dışlamaz.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      },
      {
        "situation": "Kaynak yalnız vergiye tabi haneleri kapsıyor.",
        "interpretation": "Hane kapsamı tüm bireylerin sayımı değildir.",
        "origin": "Kurgusal editör örneği; tarih veya kişi iddiası değildir."
      }
    ],
    "decision": [
      "Tarih ve kaynak kimliğini ayır.",
      "Üretici/amaç/muhatabı sor.",
      "Neden mekanizmasını belirt.",
      "Alternatif açıklamaları ve belirsizliği kaydet."
    ],
    "counterexample": "Aynı tarihi veren iki belge birbirinden kopyalandıysa bağımsız doğrulama sayılmaz.",
    "expected_output": "Olay/belge kayıtları ve kaynaklı neden/itiraz zinciri.",
    "source_ids": [
      "loc"
    ],
    "review_status": "Özgün öğretim taslağı; alan uzmanı ve kullanıcı öğrenme testi bekliyor.",
    "ready_for_app": false
  }
];

ESP.DERIN_ANALIZ_BY_DISC = (function(){
  const m = {};
  ESP.DERIN_ANALIZLER.forEach(d => { m[d.discipline] = d; });
  return m;
})();

ESP.KADEMELI_GERI_BILDIRIM = [
  {
    "id": "coach-language-notice",
    "project_id": "project-language-notice",
    "task_id": "task-language-notice-4",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: Perşembeye kadar herkes başvurabilir.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Yeni kayıt ile belge tamamlama aynı işlem mi?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Her son saatin yanına işlem adını ve bu haktan yararlanacak grubu yaz."
      },
      {
        "stage": "yeniden_deneme",
        "text": "Yeni kayıt çarşamba 18.00’de kapanıyor; o saate kadar kayıt olanlar belgeyi cuma 10.00’a kadar tamamlıyor. İlk kez başvuracak kişiye hangi sınırı söylersin?"
      }
    ],
    "retry_sample_answer": "Çarşamba 18.00; cuma 10.00 yalnız kayıtlıların belge tamamlaması içindir.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-language-comparison",
    "project_id": "project-language-comparison",
    "task_id": "task-language-comparison-2",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: Daha çok token varsa metin kesin daha zordur.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "İki dil aynı biçimde mi sözcüklere ayrılıyor?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Token sayımı ile öğrenme görevi için gereken bilgiyi ayrı alanlara koy."
      },
      {
        "stage": "yeniden_deneme",
        "text": "İki çeviride aynı kişi ve zaman korunmuş; biri 11 diğeri 15 token. Sadece bu sayıyla hangisinin zor olduğunu seçebilir misin?"
      }
    ],
    "retry_sample_answer": "Hayır. Dil yapısı, bölümleme, sözcük bilgisi ve görev talebi incelenmeli.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-logic-pump",
    "project_id": "project-logic-pump",
    "task_id": "task-logic-pump-5",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: Vana ve elektrik varsa verilen kurallara göre kesin çalışır.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Kurallarda bu iki koşuldan çalışmaya giden bir ok var mı?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Mevcut öncüllere eklediğin yeterlilik varsayımını ayrı cümle yaz."
      },
      {
        "stage": "yeniden_deneme",
        "text": "Kamera kayıt yapıyorsa depolama vardır. Depolama var. Kamera kayıt yapıyor mu?"
      }
    ],
    "retry_sample_answer": "Kesinleşmez; kayıt için yeterli koşul verilmedi.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-ethics-queue",
    "project_id": "project-ethics-queue",
    "task_id": "task-ethics-queue-3",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: A en ihtiyaçlı; tek ahlaki yanıt A’dır.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Seçimin hangi adalet ölçütüne dayanıyor?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "İhtiyaç önceliğini bekleme önceliğiyle karşılaştır; başka kişilerin bilinmeyen özelliklerini uydurma."
      },
      {
        "stage": "yeniden_deneme",
        "text": "A acil ihtiyaç, B en uzun bekleme ölçütünde öne çıkıyor. A’yı seçmenin kapsamlı fakat sınırlı gerekçesini yaz."
      }
    ],
    "retry_sample_answer": "Bu kararda acil ihtiyacı bekleme süresinin önüne koyuyorum; bekleme adaleti itirazı devam ediyor.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-music-meter",
    "project_id": "project-music-meter",
    "task_id": "task-music-meter-3",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: BPM aynıysa sekizlik akışı da aynıdır.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Metronomun her tıkında hangi nota değeri sayılıyor?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Dörtlük için iki, noktalı dörtlük için üç sekizlik dönüşümünü yaz."
      },
      {
        "stage": "yeniden_deneme",
        "text": "Dörtlük 60 ve noktalı dörtlük 40 BPM sekizlik bakımından eşit mi?"
      }
    ],
    "retry_sample_answer": "Evet:60×2=120 ve 40×3=120 sekizlik/dakika; bu, her müzikal özelliğin eşit olduğu anlamına gelmez.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-music-source",
    "project_id": "project-music-source",
    "task_id": "task-music-source-1",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: Link varsa nota hazır ve lisansı uygun demektir.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Bağlantıyı mı gördün, tekil dosyayı mı inceledin?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Katalog, seçilen baskı ve tekil kullanım koşulunu üç ayrı alan yap."
      },
      {
        "stage": "yeniden_deneme",
        "text": "Bir eser için iki baskı bağlantısı var; yalnız birinin lisans bilgisi görüldü. İkisine de aynı lisansı atar mısın?"
      }
    ],
    "retry_sample_answer": "Hayır; her baskı/dosya ile kendi lisans ilişkisinin doğrulanması gerekir.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-diction-script",
    "project_id": "project-diction-script",
    "task_id": "task-diction-script-4",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: Duyuruyu kısaltmak için herkes C’den geçsin dedim.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Dinleyici grubu ve kart koşulu nerede?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Ziyaretçiyi A’ya, kartlı personeli C’ye bağlayan iki kısa cümle kur."
      },
      {
        "stage": "yeniden_deneme",
        "text": "Misafirler X; çalışanlar kimlik kartıyla Y girişini kullanıyor. Herkes Y’ye ifadesini düzelt."
      }
    ],
    "retry_sample_answer": "Misafirler X girişini kullanır; çalışanlar kimlik kartıyla Y’den geçebilir.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-diction-count",
    "project_id": "project-diction-count",
    "task_id": "task-diction-count-3",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: A’da 9 hata B’de 6 hata var; B kesin daha başarılıdır.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "İki kayıtta kaç kelime vardı?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Hata sayısını paydasına böl; sonra bu oranın hangi niteliği ölçmediğini yaz."
      },
      {
        "stage": "yeniden_deneme",
        "text": "A 100 kelimede 5, B 200 kelimede 10 işaretli hata içeriyor. Sadece bu ölçütü karşılaştır."
      }
    ],
    "retry_sample_answer": "Her ikisi%5 işaretli hata içerir; genel konuşma başarısı bu oranla belirlenmez.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-reading-two",
    "project_id": "project-reading-two",
    "task_id": "task-reading-two-3",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: İki farklı öneri var; yazarlar zorunlu olarak karşıt.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "İki önerinin ortak amacı ne?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Araç farkını amaç çatışmasından ayrı yaz."
      },
      {
        "stage": "yeniden_deneme",
        "text": "A kütüphanenin geç kapanmasını, B daha çok şube açılmasını istiyor. Otomatik olarak çelişirler mi?"
      }
    ],
    "retry_sample_answer": "Hayır; erişim için farklı araçlar olabilir. Bütçe ve amaç bağlamı gerekir.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-reading-evidence",
    "project_id": "project-reading-evidence",
    "task_id": "task-reading-evidence-2",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: 12 kişi rahat bulmuş; çoğunluk memnun.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Çoğunluk hangi toplamın yarısından fazlası?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Payda ile sorulan ifadenin anlamını ayrı denetle."
      },
      {
        "stage": "yeniden_deneme",
        "text": "9 kişi daha ucuz dedi; toplam bilinmiyor. Çoğunluk beğendi yazılabilir mi?"
      }
    ],
    "retry_sample_answer": "Hayır; toplam eksik, daha ucuz ile beğenme de aynı ölçüm değil.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-writing-brief",
    "project_id": "project-writing-brief",
    "task_id": "task-writing-brief-3",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: Üç görüşmeden bütün mahalle mağdur sonucunu yazdım.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Kaynağın kapsadığı kişiler kimler?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Başlıktaki bütün sözcüğünü kanıtlayacak veri var mı? Kapsamı gerçek görüşmelerle sınırla."
      },
      {
        "stage": "yeniden_deneme",
        "text": "Dört çalışan servis beklediğini söylemiş; tüm fabrika mağdur başlığını düzelt."
      }
    ],
    "retry_sample_answer": "Görüşülen dört çalışan servis beklediğini bildirdi.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-writing-version",
    "project_id": "project-writing-version",
    "task_id": "task-writing-version-5",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: En kısa sürüm her zaman en iyisidir.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "Kısaltırken hangi koşul silindi?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Önce/sonra metinde talep yeterliyse bölümünü işaretle; silinince öneri nasıl değişiyor?"
      },
      {
        "stage": "yeniden_deneme",
        "text": "Bütçe yeterliyse iki atölye açalım cümlesi Atölye açalım oldu. Kayıp nedir?"
      }
    ],
    "retry_sample_answer": "Bütçe koşulu ve iki atölye miktarı kayboldu; kısalma aynı anlamı korumadı.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-history-doc",
    "project_id": "project-history-doc",
    "task_id": "task-history-doc-2",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: A ve onu kopyalayan B iki bağımsız kanıttır.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "B bilgisini nereden alıyor?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Belge sayısını aktarım zinciri sayısından ayır; A’dan B’ye ok çiz."
      },
      {
        "stage": "yeniden_deneme",
        "text": "C gazetesi D arşivini aynen aktarıyor. Aynı iddia için iki bağımsız tanıklık sayılır mı?"
      }
    ],
    "retry_sample_answer": "Bu aktarım tek başına iki bağımsız tanıklık sağlamaz; kaynak ilişkisi D’den C’yedir.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  },
  {
    "id": "coach-history-mechanism",
    "project_id": "project-history-mechanism",
    "task_id": "task-history-mechanism-1",
    "trigger": "Yanıtta şu hata açıkça gözlenirse: 2000’den 3000’e çıkmış, nüfus%50 artmış.",
    "do_not_trigger_on": "Yalnız cevap yokluğu, yazım hatası veya değerlendirilmemiş ses kaydı.",
    "feedback_sequence": [
      {
        "stage": "ilk_ipucu",
        "text": "İki sayı aynı şeyi mi sayıyor?"
      },
      {
        "stage": "ikinci_ipucu",
        "text": "Hane ve kişi etiketlerini sayılarla birlikte yaz; dönüşüm bilgisi var mı kontrol et."
      },
      {
        "stage": "yeniden_deneme",
        "text": "Bir yılda 400 aile, sonra 600 kişi kaydı var. Artış yüzdesi hesaplanabilir mi?"
      }
    ],
    "retry_sample_answer": "Aile ve kişi eşlenmeden nüfus artışı hesaplanamaz; aile büyüklüğü uydurulmaz.",
    "review_evidence_required": "Değerlendirici, öğrenci yanıtından hatayı gösteren kısa bölümü kaydeder; kişiye yetenek veya öğrenme stili etiketi verilmez.",
    "provenance": "Özgün editör önerisi; gerçek kişilerin denenmiş taktiği veya etki kanıtı değil.",
    "ready_for_app": false
  }
];
