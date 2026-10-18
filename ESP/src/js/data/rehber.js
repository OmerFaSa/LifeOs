/* ESP ANLATIMLARI — her alanın orta seviye konu anlatımı (brand/ortak/rehber.js).

   Kullanıcı (2026-10-18): «ESP'de anlatımlar yok; bölümlerin içine her
   alanın kendisiyle alakalı orta seviye bir anlatım ekle».

   KAYNAK VE SINIR. LifeOS'un geliştirme oturumu (Claude) elle yazdı; ekranda
   «elle yazıldı · doğrulanmadı» yazar. ESP öğretmen değildir (ESP.PEDAGOGIC):
   anlatım bir başlangıç malzemesidir; seviye, yetenek ya da yeterlilik
   yargısı kurmaz, sonuç garantisi vermez. `disc` alanı anlatımın hangi
   Çalışma bölümünde görüneceğini söyler. */

window.ESP = window.ESP || {};

ESP.REHBER_SINIR = 'Bu anlatımlar genel bir başlangıç malzemesidir; bir dersin ya da öğretmenin yerini tutmaz '
  + 've hiçbir seviye ya da yeterlilik belgesi değildir.';

ESP.REHBER_KONULAR = [

  /* ================================================================ YABANCI DİL */
  { id:'dil-isleyis', disc:'lang', alan:'Yabancı Dil', ad:'Dil öğrenmenin işleyişi: girdi, çıktı, tekrar', sure:8,
    giris:'Bir dil, kuralları ezberleyerek değil; anladığın bol girdiyle, kendi ürettiğin çıktıyla ve unutmadan önce yapılan tekrarla yerleşir. Bu üç ayağın dengesi, hangi yöntemi seçersen seç belirleyicidir.',
    kazanim:['Girdi, çıktı ve tekrarın rolünü ayırt eder.', 'CEFR seviyelerinin neyi tarif ettiğini bilir.', 'Haftalık çalışmasını bu üç ayağa göre dengeler.'],
    bolumler:[
      { baslik:'Anlaşılır girdi', metin:'Dinlediğin ve okuduğun metnin büyük kısmını anlıyor, küçük bir kısmını bağlamdan çıkarıyorsan, o girdi öğrenmeye en elverişli düzeydedir. Çok kolay girdi yeni bir şey öğretmez; çok zor girdi ise yalnızca yorar.',
        liste:['Kendi seviyene yakın podcast, dizi ya da kitap seç.', 'Aynı içeriği iki kez dinlemek ilkinde kaçanı yakalatır.', 'Altyazı önce ana dilde, sonra hedef dilde, en sonda kapalı.'],
        dikkat:'«Yalnız dinleyerek öğrenirsin» iddiası tartışmalıdır; girdi gereklidir ama tek başına konuşmayı getirmez.' },
      { baslik:'Çıktı: konuşmak ve yazmak', metin:'Çıktı üretirken bilmediğin şeyi fark edersin: bir kelimeyi bulamazsın, bir yapıyı kuramazsın. Bu fark ediş, sonraki girdiye dikkatle bakmanı sağlar. Kısa günlük yazılar, kendi kendine sesli anlatım ve konuşma pratiği çıktının en kolay yollarıdır.' },
      { baslik:'Unutmadan tekrar', metin:'Yeni bir kelime tekrar edilmezse günler içinde büyük ölçüde unutulur. **Aralıklı tekrar**, bir bilgiyi tam unutmak üzereyken yeniden hatırlatır; her başarılı hatırlamadan sonra aralık uzar.',
        formul:['Leitner kutuları: 1. kutu her gün · 2. kutu 2 günde bir · 3. kutu 4 günde bir · 4. kutu 8 günde bir', 'Doğru hatırlanan kart bir kutu ileri, yanlış hatırlanan 1. kutuya döner'],
        ornek:{ soru:'Bir kart 1. kutuda bugün doğru hatırlandı, 2. kutuda da doğru hatırlandı. Leitner düzenine göre bir sonraki tekrarı hangi kutudan ve kaç gün aralıkla gelir?',
          cozum:['1. kutudan doğru: 2. kutuya geçti.', '2. kutudan doğru: 3. kutuya geçti.', '3. kutu 4 günde bir tekrar edilir.'] } },
      { baslik:'Seviyeler: CEFR', metin:'Avrupa Ortak Başvuru Metni dil yeterliliğini altı seviyede tarif eder: **A1–A2** temel, **B1–B2** bağımsız, **C1–C2** yetkin kullanıcı. Her seviye «neler yapabilir» cümleleriyle tanımlanır: B1 seviyesindeki biri, örneğin, tanıdık konularda açık standart girdinin ana noktalarını anlar.',
        dikkat:'ESP’deki seviye bandı yalnız son günlerin ölçülmüş üretimini tarif eder; resmî bir sınavın ya da sertifikanın yerini tutmaz.' },
    ],
    akilda:['Anladığın ama biraz zorlayan girdi en verimlisidir.', 'Çıktı, eksiğini görmeni sağlar.', 'Aralıklı tekrar unutmayı yavaşlatır.'],
    kaynaklar:['Avrupa Konseyi, CEFR Tamamlayıcı Cilt (2020)', 'Nation, Learning Vocabulary in Another Language (2013)', 'Leitner, So lernt man lernen (1972)'] },

  { id:'dil-kelime', disc:'lang', alan:'Yabancı Dil', ad:'Kelime ve dilbilgisi nasıl kalıcı olur?', sure:7,
    giris:'Bir kelimeyi «bilmek» yalnız anlamını tanımak değil; söyleyişini, yazılışını, hangi kelimelerle birlikte kullanıldığını ve hangi durumda uygun düştüğünü bilmektir. Dilbilgisi de en iyi, gerçek cümlelerin içinde kalıp olarak yerleşir.',
    kazanim:['Kelimeyi bağlamıyla ve eşdizimiyle öğrenir.', 'Aktif hatırlamanın tanımaktan farkını bilir.', 'Dilbilgisini kalıplar üzerinden çalışır.'],
    bolumler:[
      { baslik:'Kelime bilgisinin katmanları', metin:'Bir kelimeyi tam bilmek birkaç katmandan oluşur. Önce anlam ve söyleyiş gelir; kullanım zamanla oturur.',
        liste:['**Biçim:** söyleyiş ve yazılış.', '**Anlam:** temel anlam ve yan anlamlar.', '**Kullanım:** eşdizimler (make a decision, do homework), resmî ya da gündelik oluşu.'] },
      { baslik:'Tanımak değil, hatırlamak', metin:'Bir listeye bakıp «bunu biliyorum» demek tanımaktır ve yanıltıcıdır. Kartın ön yüzünü görüp arka yüzü **kendin hatırlamaya çalışmak** (aktif hatırlama) çok daha kalıcıdır. Kendi cümleni kurmak bir adım daha ileridir.',
        ornek:{ soru:'«decision» kelimesini öğrenen biri için hangi kart daha etkilidir: «decision = karar» mı, yoksa «I need to make a ___ by Friday.» mı?',
          cozum:['İkinci kart kelimeyi bağlam ve eşdizimle (make a decision) birlikte çalıştırır.', 'Boşluğu doldurmak aktif hatırlama gerektirir; birinci kart yalnız eşleştirmedir.'] } },
      { baslik:'Dilbilgisi: kalıp ve fark ediş', metin:'Kuralı bir kez okumak yeterli değildir; aynı yapının çok sayıda örnekte görülmesi ve kullanılması gerekir. Bir yapıyı çalışırken önce örnek cümlelerde fark et, sonra kendi cümlende kullan, en son kuralı kendi sözünle yaz.',
        dikkat:'Hata yapmak öğrenmenin parçasıdır; hatanı düzelten geri bildirim, hatasız ama az üretimden daha öğreticidir.' },
    ],
    akilda:['Kelime = biçim + anlam + kullanım.', 'Hatırlamaya çalışmak, tanımaktan kalıcıdır.', 'Dilbilgisi örneklerde fark edilir, kullanımla yerleşir.'],
    kaynaklar:['Nation, Learning Vocabulary in Another Language (2013)', 'Roediger ve Karpicke, hatırlama ile öğrenme üzerine (2006)'] },

  /* ================================================================ FELSEFE */
  { id:'felsefe-alanlar', disc:'philo', alan:'Felsefe', ad:'Felsefenin temel alanları ve soruları', sure:8,
    giris:'Felsefe, cevabı deneyle bulunamayan ama herkesin bir gün sorduğu soruları sistemli biçimde düşünmektir: Ne vardır? Ne bilebilirim? Ne yapmalıyım? Güzel olan nedir?',
    kazanim:['Felsefenin ana dallarını ve sorularını eşleştirir.', 'Sokratik sorgulamanın nasıl işlediğini bilir.'],
    bolumler:[
      { baslik:'Ana dallar', metin:'Felsefe sorularını konularına göre dallara ayırmak, bir metni okurken nerede durduğunu anlamayı kolaylaştırır.',
        liste:['**Varlık felsefesi (ontoloji):** Gerçekte ne vardır? Zihin ile beden aynı şey mi?', '**Bilgi felsefesi (epistemoloji):** Bilgi nedir? Duyularımıza güvenebilir miyiz?', '**Ahlak felsefesi (etik):** Doğru eylem nedir? İyi bir hayat nasıl yaşanır?', '**Siyaset felsefesi:** Devlet neden meşrudur? Adalet nedir?', '**Sanat felsefesi (estetik):** Güzellik nedir? Sanatı sanat yapan ne?', '**Mantık:** Doğru akıl yürütmenin kuralları nelerdir?'] },
      { baslik:'Etikte üç büyük yaklaşım', metin:'Bir eylemin doğruluğunu değerlendirmenin üç klasik yolu vardır ve çoğu ahlaki tartışma bunların çatışmasıdır.',
        liste:['**Sonuççuluk:** Doğru eylem en iyi sonucu doğurandır (Bentham, Mill).', '**Ödev ahlakı:** Bazı eylemler sonuçtan bağımsız olarak doğru ya da yanlıştır (Kant).', '**Erdem etiği:** Soru «ne yapmalıyım?» değil, «nasıl biri olmalıyım?»dır (Aristoteles).'],
        ornek:{ soru:'«Yalan söylemek bir hayat kurtaracaksa söylenmeli» diyen biri hangi yaklaşıma yakındır?',
          cozum:['Eylemi sonucuna (bir hayatın kurtulması) göre değerlendiriyor.', 'Bu sonuççu bir akıl yürütmedir; Kant’ın ödev ahlakı ise yalanı sonuçtan bağımsız olarak yanlış sayar.'] } },
      { baslik:'Sokratik sorgulama', metin:'Sokrates, bir kavramın tanımını soruşturarak karşısındakinin çelişkilerini gün ışığına çıkarırdı. Bugün de bir düşünceyi sınamanın güçlü yoludur: «Bununla tam olarak neyi kastediyorsun?», «Buna bir karşı örnek var mı?», «Bu doğruysa başka neyin doğru olması gerekir?»',
        dikkat:'Sokratik sorgulamanın amacı karşıdakini yenmek değil, kavramı birlikte netleştirmektir.' },
    ],
    akilda:['Varlık, bilgi, ahlak, siyaset, sanat ve mantık.', 'Sonuççuluk, ödev ahlakı, erdem etiği.', 'İyi soru: tanım, karşı örnek, sonuç.'],
    kaynaklar:['Stanford Encyclopedia of Philosophy (ilgili maddeler)', 'Warburton, Felsefenin Kısa Tarihi (2011)'] },

  { id:'mantik-arguman', disc:'philo', alan:'Felsefe', ad:'Argüman, geçerlilik ve safsatalar', sure:8,
    giris:'Bir argüman, öncüllerden bir sonuca varan akıl yürütmedir. Bir argümanı değerlendirmek iki soruyu ayırmayı gerektirir: Sonuç öncüllerden gerçekten çıkıyor mu? Öncüller doğru mu?',
    kazanim:['Bir argümanın öncül ve sonucunu ayırır.', 'Geçerlilik ile sağlamlığı ayırt eder.', 'Yaygın safsataları tanır.'],
    bolumler:[
      { baslik:'Öncül ve sonuç', metin:'«Bütün insanlar ölümlüdür. Sokrates bir insandır. Öyleyse Sokrates ölümlüdür.» İlk iki cümle **öncül**, sonuncusu **sonuçtur**. Günlük dilde sonuç çoğu zaman başta söylenir; «çünkü», «zira» öncülü, «öyleyse», «bu yüzden» sonucu haber verir.' },
      { baslik:'Geçerli mi, sağlam mı?', metin:'Öncüller doğru kabul edildiğinde sonucun da zorunlu olarak doğru olduğu argüman **geçerlidir**. Geçerli olup öncülleri gerçekten doğru olan argüman **sağlamdır**.',
        formul:['Modus ponens: P ise Q. P. Öyleyse Q. (geçerli)', 'Sonucu onaylama: P ise Q. Q. Öyleyse P. (geçersiz)'],
        ornek:{ soru:'«Yağmur yağarsa yol ıslanır. Yol ıslak. Öyleyse yağmur yağmıştır.» Bu argüman geçerli midir?',
          cozum:['Biçim: P ise Q; Q; öyleyse P.', 'Bu «sonucu onaylama» safsatasıdır: yol başka bir nedenle (sulama) de ıslanmış olabilir.', 'Argüman geçersizdir.'] } },
      { baslik:'Yaygın safsatalar', metin:'Safsata, ikna edici görünen ama hatalı akıl yürütmedir.',
        liste:['**Kişiye saldırı:** argümanı değil, söyleyeni hedef almak.', '**Saman adam:** karşı görüşü çarpıtıp çarpıtılmış hâlini çürütmek.', '**Yanlış ikilem:** başka seçenekler varken yalnız ikisini sunmak.', '**Kaygan zemin:** küçük bir adımın kanıtsız biçimde felakete götüreceğini söylemek.', '**Otoriteye başvuru:** konusunda uzman olmayan birinin sözünü kanıt saymak.'],
        dikkat:'Bir argümanda safsata bulmak, sonucun yanlış olduğunu kanıtlamaz; yalnız bu argümanın onu desteklemediğini gösterir.' },
    ],
    akilda:['Geçerlilik biçimle, sağlamlık öncüllerin doğruluğuyla ilgilidir.', 'Sonucu onaylamak geçersizdir.', 'Safsata, sonucu değil argümanı çürütür.'],
    kaynaklar:['Stanford Encyclopedia of Philosophy, «Informal Logic» ve «Fallacies»', 'Weston, A Rulebook for Arguments (2018)'] },

  /* ================================================================ MÜZİK */
  { id:'muzik-teori', disc:'music', alan:'Müzik / Gitar', ad:'Temel müzik teorisi: nota, aralık, gam', sure:9,
    giris:'Batı müziğinde bir oktav on iki yarım sese bölünür. Notalar, aralıklar ve gamlar bu on iki sesin düzenli seçimleridir; gitarda her perde bir yarım sestir, bu yüzden teori sapın üstünde doğrudan görülür.',
    kazanim:['Tam ve yarım sesi ayırt eder.', 'Majör gamı formülüyle kurar.', 'Temel aralıkları adlandırır.'],
    bolumler:[
      { baslik:'On iki yarım ses', metin:'Do, re, mi, fa, sol, la, si (C, D, E, F, G, A, B) doğal notalardır. Aralarında genellikle **tam ses** (iki yarım ses) vardır; yalnız **mi–fa (E–F)** ve **si–do (B–C)** arası **yarım sestir**. Diyez (♯) bir notayı yarım ses tizleştirir, bemol (♭) pesleştirir.',
        dikkat:'Gitarda bir perde ileri = yarım ses; iki perde = tam ses.' },
      { baslik:'Majör gam', metin:'Majör gam her tondan aynı adım formülüyle kurulur. C (do) majörde hiç diyez ya da bemol yoktur; başka tonlarda formülün tutması için değişim işaretleri gerekir.',
        formul:['Majör gam: T – T – Y – T – T – T – Y (T = tam, Y = yarım ses)', 'C majör: C D E F G A B C', 'G majör: G A B C D E F♯ G'],
        ornek:{ soru:'G majör gamında neden F yerine F♯ kullanılır?',
          cozum:['G’den başlayınca formülün 6. ve 7. adımı E–F–G olmalı: T sonra Y.', 'Doğal F ile E–F yarım, F–G tam ses olur; sıra ters düşer.', 'F’yi F♯ yapınca E–F♯ tam, F♯–G yarım ses olur ve formül tutar.'] } },
      { baslik:'Aralıklar', metin:'İki nota arasındaki uzaklığa aralık denir ve yarım ses sayısıyla ölçülür. En sık kullanılanlar akorların da yapı taşıdır.',
        liste:['**Küçük üçlü:** 3 yarım ses (A–C).', '**Büyük üçlü:** 4 yarım ses (C–E).', '**Tam dörtlü:** 5 yarım ses (C–F).', '**Tam beşli:** 7 yarım ses (C–G).', '**Oktav:** 12 yarım ses (C–C).'] },
    ],
    akilda:['Bir oktav = 12 yarım ses; E–F ve B–C yarım ses.', 'Majör: T T Y T T T Y.', 'Büyük üçlü 4, tam beşli 7 yarım ses.'],
    kaynaklar:['Kostka ve Payne, Tonal Harmony', 'ABRSM, The AB Guide to Music Theory'] },

  { id:'akor-ritim', disc:'music', alan:'Müzik / Gitar', ad:'Akorlar ve ritim', sure:8,
    giris:'Akor, aynı anda çalınan üç ya da daha fazla notadır; ritim ise bu seslerin zamana yerleşmesidir. Pop ve rock şarkılarının çoğu birkaç temel akor ve düzenli bir ritimle kurulur.',
    kazanim:['Majör ve minör akoru aralıklarıyla kurar.', 'Bir tondaki temel akor dizilerini tanır.', 'Metronomla yavaş ve temiz çalışmanın mantığını bilir.'],
    bolumler:[
      { baslik:'Majör ve minör akor', metin:'Üç sesli akor bir kök ses, onun üzerindeki üçlü ve beşliden oluşur. Üçlünün büyük ya da küçük oluşu akorun karakterini belirler.',
        formul:['Majör akor: kök + büyük üçlü (4) + tam beşli (7) → C majör: C E G', 'Minör akor: kök + küçük üçlü (3) + tam beşli (7) → A minör: A C E'],
        ornek:{ soru:'G majör akorunun notaları nelerdir?',
          cozum:['Kök: G.', 'Büyük üçlü (4 yarım ses): G → G♯ → A → A♯ → B; yani B.', 'Tam beşli (7 yarım ses): D.', 'G majör: G B D.'] } },
      { baslik:'Tondaki akorlar', metin:'Bir majör tonun her basamağından bir akor kurulur ve Romen rakamıyla gösterilir: büyük harf majör, küçük harf minör. C majörde I = C, IV = F, V = G, vi = Am’dir. Çok sayıda şarkı **I–V–vi–IV** (C–G–Am–F) ya da **I–IV–V** dizisini kullanır.',
        dikkat:'Aynı diziyi başka tona taşımak için akor adları değil Romen rakamları ezberlenir; kapo da bunu gitarda kolaylaştırır.' },
      { baslik:'Ölçü, tempo ve metronom', metin:'4/4 ölçüde her ölçüde dört vuruş vardır. Tempo dakikadaki vuruş sayısıyla (BPM) ölçülür. Yeni bir geçişi temiz çalabildiğin en yavaş tempoda başlatıp her gün birkaç BPM artırmak, hızlı ama hatalı tekrardan daha çabuk ilerletir.',
        ornek:{ soru:'Metronom 60 BPM’de iken her vuruş kaç saniyedir? Sekizlik notalar kaç saniyede bir çalınır?',
          cozum:['60 vuruş / 60 saniye = vuruş başına 1 saniye.', 'Sekizlik nota vuruşun yarısıdır: 0,5 saniye.'] } },
    ],
    akilda:['Majör: 4 + 3; minör: 3 + 4 yarım ses.', 'I–V–vi–IV ve I–IV–V en yaygın dizilerdir.', 'Temiz ve yavaş, hızlı ve hatalıdan önce gelir.'],
    kaynaklar:['Kostka ve Payne, Tonal Harmony', 'Kasıtlı pratik üzerine araştırmalar (Ericsson ve ark., 1993)'] },

  /* ================================================================ DİKSİYON */
  { id:'nefes-ses', disc:'diction', alan:'Diksiyon', ad:'Nefes, ses ve rezonans', sure:7,
    giris:'Etkili konuşma, sesin kaynağı olan nefesle başlar. Ses telleri titreşimi üretir; göğüs, ağız ve geniz boşlukları bu sesi büyütür ve renklendirir. Doğru nefes sesi hem güçlü hem yorulmadan taşır.',
    kazanim:['Karın (diyafram) nefesini omuz nefesinden ayırır.', 'Sesin nasıl üretildiğini kabaca açıklar.', 'Ses sağlığı için temel kuralları bilir.'],
    bolumler:[
      { baslik:'Karın nefesi', metin:'Nefes alırken omuzlar kalkıyorsa nefes yüzeyseldir. **Karın nefesinde** diyafram aşağı iner, karın ve bel hafifçe genişler, omuzlar kıpırdamaz. Konuşmaya bu derin ve sakin nefesle başlamak sesi destekler.',
        liste:['Bir elini göğsüne, diğerini karnına koy.', 'Burundan nefes al: yalnız karnındaki el yükselmeli.', 'Ağızdan «sss» diye yavaşça ver; süreyi her gün biraz uzatmaya çalış.'] },
      { baslik:'Ses ve rezonans', metin:'Nefes ses tellerinden geçerken onları titreştirir; bu ham ses boğaz, ağız ve geniz boşluklarında güçlenir. Rahat bir çene, gevşek bir boyun ve açık bir ağız boşluğu sesin daha dolgun duyulmasını sağlar.',
        dikkat:'Sesi boğazdan zorlayarak yükseltmek yorar; ses yüksekliği nefes desteği ve rezonansla artırılır.' },
      { baslik:'Ses sağlığı', metin:'Ses telleri bir kastır ve dinlenmeye ihtiyaç duyar. Bol su içmek, uzun konuşmalardan önce kısa bir ısınma yapmak, bağırmaktan ve fısıldamaktan kaçınmak sesi korur.',
        dikkat:'İki üç haftadan uzun süren ses kısıklığı bir kulak burun boğaz hekimine gösterilir.' },
    ],
    akilda:['Omuz değil, karın nefesi.', 'Yükseklik nefes ve rezonansla, boğazı sıkarak değil.', 'Su, ısınma ve dinlenme.'],
    kaynaklar:['Ses sağlığı üzerine KBB ve konuşma terapisi kaynakları (ör. ASHA)', 'Linklater, Freeing the Natural Voice'] },

  { id:'bogumlama-vurgu', disc:'diction', alan:'Diksiyon', ad:'Boğumlama, vurgu ve tonlama', sure:8,
    giris:'Anlaşılır konuşmanın üç ayağı vardır: sesleri net çıkarmak (boğumlama), doğru heceyi ve kelimeyi öne çıkarmak (vurgu) ve cümlenin ezgisini anlama göre kurmak (tonlama).',
    kazanim:['Türkçede kelime vurgusunun genel kuralını ve istisnalarını bilir.', 'Cümle vurgusunu yerleştirir.', 'Tonlama ve duraklamayla anlamı değiştirir.'],
    bolumler:[
      { baslik:'Boğumlama', metin:'Boğumlama, seslerin dudak, dil ve dişlerle tam ve net çıkarılmasıdır. Kelime sonlarını yutmak ve hızlı konuşurken heceleri birleştirmek en yaygın sorunlardır. Kalem ısırarak okuma ya da tekerleme çalışmaları dil ve dudak kaslarını çalıştırır.' },
      { baslik:'Kelime vurgusu', metin:'Türkçede kelime vurgusu genellikle **son hecededir**: kitap**LIK**, gel**DİM**. Bazı kelime türleri bu kuralın dışındadır.',
        liste:['**Yer adlarının çoğu:** **AN**kara, **İS**tanbul, **İZ**mir.', '**Bazı zarflar:** **ŞİM**di, **SON**ra, **YAR**ın.', '**Ünlemler ve seslenmeler:** **HAY**di, **A**nne!'],
        dikkat:'«Ankara’da» derken vurgu yine ilk hecede kalır; ek almak yer adının vurgusunu taşımaz.' },
      { baslik:'Cümle vurgusu ve tonlama', metin:'Türkçede cümlenin en önemli öğesi genellikle **yüklemin hemen önüne** gelir ve vurguyu alır. Aynı kelimelerle kurulan cümlede öğelerin yeri değişince vurgulanan bilgi de değişir.',
        ornek:{ soru:'«Ali dün okula gitti.» ve «Ali okula dün gitti.» cümlelerinde vurgulanan bilgi nedir?',
          cozum:['Birincide yüklemden önce «okula» gelir: nereye gittiği önemlidir.', 'İkincide «dün» gelir: ne zaman gittiği önemlidir.'] },
        dikkat:'Soru cümlelerinde ezgi soru ekinden önceki hecede yükselir; düz okununca soru olduğu anlaşılmaz.' },
    ],
    akilda:['Kelime vurgusu genellikle son hecede; yer adları ve bazı zarflar istisna.', 'Cümle vurgusu yüklemden önceki öğede.', 'Duraklama ve tonlama anlamı taşır.'],
    kaynaklar:['TDK Yazım Kılavuzu ve Türkçe ses bilgisi kaynakları', 'Ergenç, Türkçe Söyleyiş Sözlüğü'] },

  /* ================================================================ DERİN OKUMA */
  { id:'aktif-okuma', disc:'reading', alan:'Derin Okuma', ad:'Aktif okuma: SQ3R ve not almak', sure:7,
    giris:'Bir metni gözle taramak ile anlamak farklı şeylerdir. Aktif okuma, okurken sorular sorup cevaplarını aramak ve okuduğunu kendi sözünle yeniden kurmaktır; hatırlanan miktarı belirgin biçimde artırır.',
    kazanim:['SQ3R adımlarını uygular.', 'Kenar notu ve özetin farkını bilir.', 'Okuduğunu kendi sözüyle anlatarak sınar.'],
    bolumler:[
      { baslik:'SQ3R', metin:'Robinson’ın 1946’da önerdiği yöntem beş adımdan oluşur ve özellikle bilgi yoğun metinlerde işe yarar.',
        liste:['**Göz at (Survey):** başlıklar, giriş, sonuç, görseller.', '**Soru (Question):** başlıkları soruya çevir.', '**Oku (Read):** sorunun cevabını arayarak oku.', '**Anlat (Recite):** kitabı kapatıp cevabı kendi sözünle söyle ya da yaz.', '**Gözden geçir (Review):** sonunda ve birkaç gün sonra tekrar et.'] },
      { baslik:'Not almak', metin:'Altını çizmek tek başına zayıf bir yöntemdir; neyin önemli olduğuna karar vermeyi erteler. Kenara kısa bir soru ya da kendi cümlenle bir özet yazmak metni işlemeye zorlar.',
        ornek:{ soru:'Bir paragrafın tamamının altını çizen biri ne yapabilir?',
          cozum:['Paragrafı bitirip tek cümlelik bir özet yazmayı dener.', 'Özet yazılamıyorsa paragraf henüz anlaşılmamıştır; yeniden okunur.'] },
        dikkat:'Not, metni kopyalamak değil, kendi sözünle yeniden kurmaktır.' },
      { baslik:'Kendine anlatarak sınamak', metin:'Okuduğun bir fikri, konuyu bilmeyen birine anlatır gibi sade cümlelerle yazmaya çalış. Takıldığın yer, anlamadığın yerdir: oraya geri dön. ESP’nin «Öğrendiğini anlat» aracı bu adımın ölçülebilir hâlidir.' },
    ],
    akilda:['Göz at, soru sor, oku, anlat, gözden geçir.', 'Altını çizmek değil, kendi sözünle yazmak.', 'Anlatamadığın yer, anlamadığın yerdir.'],
    kaynaklar:['Robinson, Effective Study (1946)', 'Dunlosky ve ark., öğrenme teknikleri üzerine derleme (2013)'] },

  { id:'zor-metin', disc:'reading', alan:'Derin Okuma', ad:'Zor bir metni okumak', sure:7,
    giris:'Felsefe, bilim ya da klasik edebiyat metinleri ilk okumada anlaşılmayabilir; bu bir yetersizlik değil, metnin doğasıdır. Zor metin birkaç katmanda, yavaş ve plana göre okunur.',
    kazanim:['Bir metnin yapısını çıkarır.', 'Argümanı haritalar.', 'Hızlı okuma iddialarına eleştirel bakar.'],
    bolumler:[
      { baslik:'İki okuma', metin:'İlk okuma haritayı çıkarmak içindir: metin neyi savunuyor, hangi bölüm ne iş görüyor? Bilinmeyen terimlerde durmadan ilerlenir, yalnızca işaretlenir. İkinci okuma ayrıntı ve argüman içindir; işaretlenen terimler bu kez çözülür.' },
      { baslik:'Argüman haritası', metin:'Her paragrafın tek cümlelik özetini alt alta yazmak, metnin iskeletini gösterir. Sonra bu cümleler «iddia», «gerekçe», «örnek» ve «itiraz» olarak işaretlenir.',
        ornek:{ soru:'Bir denemede yazar önce bir görüşü özetliyor, sonra ona üç karşı örnek veriyor ve sonunda kendi görüşünü söylüyor. Haritada bu nasıl görünür?',
          cozum:['1. paragraf: karşı görüşün özeti (itiraz edilen iddia).', '2–4. paragraflar: karşı örnekler (gerekçe).', 'Son paragraf: yazarın asıl iddiası.'] } },
      { baslik:'Hız ve anlama', metin:'Anlamayı koruyarak okuma hızını birkaç katına çıkardığını iddia eden yöntemler araştırmalarda desteklenmemiştir; hız arttıkça anlama düşer. Zor metinde yavaşlamak, geri dönmek ve durup düşünmek verimsizlik değil, okumanın kendisidir.',
        dikkat:'Sayfa sayısı değil, metinden geriye kalan fikir ölçülür.' },
    ],
    akilda:['Önce harita, sonra ayrıntı.', 'Her paragrafa tek cümle.', 'Hız ve anlama birbirinin bedelidir.'],
    kaynaklar:['Adler ve Van Doren, How to Read a Book (1972)', 'Rayner ve ark., hızlı okuma üzerine derleme, Psychological Science in the Public Interest (2016)'] },

  /* ================================================================ YAZI */
  { id:'paragraf-deneme', disc:'writing', alan:'Yazı', ad:'Paragraf ve deneme yapısı', sure:8,
    giris:'İyi bir yazı okura yol gösterir: her paragraf tek bir fikri işler, paragraflar bir tezin etrafında sıralanır. Yapıyı kurmak, güzel cümle kurmaktan önce gelir.',
    kazanim:['Konu cümlesi olan bir paragraf kurar.', 'Tez cümlesini yazar.', 'Giriş, gelişme ve sonucu işlevleriyle ayırt eder.'],
    bolumler:[
      { baslik:'Paragraf: bir fikir', metin:'Paragrafın ilk cümlesi çoğu zaman **konu cümlesidir** ve paragrafın ne söyleyeceğini haber verir. Ardından açıklama, örnek ya da kanıt gelir; son cümle fikri bağlar ya da sonraki paragrafa köprü kurar.',
        dikkat:'Bir paragrafta iki ayrı fikir varsa iki paragrafa bölünür.' },
      { baslik:'Tez cümlesi', metin:'Tez, yazının savunduğu tek cümlelik iddiadır. İyi bir tez tartışılabilir, belirli ve yazı boyunca desteklenebilir olmalıdır.',
        ornek:{ soru:'«Teknoloji hayatımızı etkiliyor.» cümlesi neden zayıf bir tezdir? Nasıl güçlendirilebilir?',
          cozum:['Herkesin kabul edeceği, genel ve belirsiz bir cümledir; tartışılacak bir iddia yoktur.', 'Güçlü hâli: «Bildirimler, gün içindeki kesintisiz odaklanma süremizi kısaltarak derin çalışmayı zorlaştırıyor.»'] } },
      { baslik:'Giriş, gelişme, sonuç', metin:'Giriş okuru konuya çeker ve tezi söyler. Gelişme paragrafları tezi birer gerekçeyle destekler. Sonuç, söyleneni tekrar etmekten çok, tezin neden önemli olduğunu ve neyi düşündürmesi gerektiğini söyler.',
        liste:['Giriş: bağlam + tez.', 'Gelişme: her paragrafa bir gerekçe ve onun kanıtı.', 'Sonuç: tezi yeni bir açıdan bağlama.'] },
    ],
    akilda:['Bir paragraf, bir fikir.', 'Tez tartışılabilir ve belirli olmalı.', 'Sonuç özet değil, anlamdır.'],
    kaynaklar:['Strunk ve White, The Elements of Style', 'Graff ve Birkenstein, They Say / I Say (2018)'] },

  { id:'yeniden-yazma', disc:'writing', alan:'Yazı', ad:'Yeniden yazma: açık ve sade cümle', sure:7,
    giris:'İlk taslak düşünceyi kâğıda dökmek içindir; yazı asıl yeniden yazarken olgunlaşır. Açık yazının sırrı, gereksizi atmak ve her cümleye tek bir iş vermektir.',
    kazanim:['Uzun cümleyi bölebilir.', 'Gereksiz sözcükleri ve tekrarları ayıklar.', 'Sesli okuyarak akışı sınar.'],
    bolumler:[
      { baslik:'Uzun cümleyi bölmek', metin:'Bir cümlede üç dört ayrı bilgi varsa okur ilkini unutur. Her cümleye tek bir ana bilgi vermek akışı hızlandırır.',
        ornek:{ soru:'«Toplantıda, geçen ay başlayan ve bütçesi henüz netleşmeyen projenin, ekip üyelerinin farklı beklentileri olduğu için ertelenmesi gündeme geldi.» cümlesi nasıl sadeleşir?',
          cozum:['Proje geçen ay başladı ve bütçesi henüz netleşmedi.', 'Ekip üyelerinin beklentileri farklı.', 'Bu yüzden toplantıda projenin ertelenmesi gündeme geldi.'] } },
      { baslik:'Gereksizi atmak', metin:'Anlamı değiştirmeden çıkarılabilen her sözcük okuru yorar.',
        liste:['«Aşağı yukarı yaklaşık 10» → «yaklaşık 10»: iki sözcük aynı işi görüyor.', '«Bu konu hakkında bir değerlendirme yapmak» → «bu konuyu değerlendirmek».', 'Aynı sözcüğün art arda cümlelerde tekrarı: eş anlamlı ya da zamir kullan.'],
        dikkat:'Sadeleştirmek düzleştirmek değildir; yazarın sesi ve gerekli ayrıntı korunur.' },
      { baslik:'Sesli okumak', metin:'Taslağı sesli okumak, gözün atladığı takılmaları kulağa duyurur. Nefesin yetmediği cümle uzundur; tekrar eden ses kulağı rahatsız eder; okurken düzelttiğin yer, yazıda da düzeltilmelidir.' },
    ],
    akilda:['Bir cümle, bir ana bilgi.', 'Anlamı değiştirmeden çıkan sözcük gereksizdir.', 'Sesli oku: takıldığın yeri düzelt.'],
    kaynaklar:['Zinsser, On Writing Well', 'TDK Yazım Kılavuzu'] },

  /* ================================================================ TARİH */
  { id:'tarih-yontem', disc:'history', alan:'Tarih', ad:'Tarih nasıl çalışılır: kaynak ve kronoloji', sure:8,
    giris:'Tarih, geçmişte ne olduğunu kaynaklara dayanarak yeniden kurma çabasıdır. Tarihçinin temel aracı kaynak eleştirisidir: bir belgeyi kim, ne zaman, neden yazdı?',
    kazanim:['Birincil ve ikincil kaynağı ayırt eder.', 'Bir kaynağa eleştirel sorular sorar.', 'Kronoloji ve nedensellik kurar, anakronizmden kaçınır.'],
    bolumler:[
      { baslik:'Birincil ve ikincil kaynak', metin:'Olayın yaşandığı döneme ait belge, mektup, yazıt, fotoğraf ya da tanık anlatısı **birincil kaynaktır**. Sonradan bu kaynaklara dayanarak yazılan incelemeler **ikincil kaynaktır**.',
        ornek:{ soru:'Kurtuluş Savaşı sırasında bir askerin yazdığı mektup ile 1990’da yazılmış bir Kurtuluş Savaşı tarihi kitabı hangi kaynak türüdür?',
          cozum:['Mektup olay sırasında yazılmıştır: birincil kaynak.', 'Kitap sonradan, kaynaklara dayanarak yazılmıştır: ikincil kaynak.'] } },
      { baslik:'Kaynak eleştirisi', metin:'Her kaynak bir bakış açısından yazılır. Bir belgeyi okurken şu sorular sorulur:',
        liste:['Kim yazdı, olayın içinde miydi?', 'Ne zaman yazıldı: olay sırasında mı, yıllar sonra mı?', 'Neden ve kimin için yazıldı?', 'Başka kaynaklar ne diyor; çelişki var mı?'],
        dikkat:'Bir kaynağın taraflı olması onu değersiz kılmaz; tarafını bilmek onu doğru okumayı sağlar.' },
      { baslik:'Kronoloji, nedensellik, anakronizm', metin:'Olayları sıraya koymak (kronoloji) ilk adımdır; asıl soru olaylar arasındaki neden-sonuç ilişkisidir. Bir olayı kendi döneminin bilgisi ve değerleriyle değil, bugünün ölçüleriyle yargılamaya **anakronizm** denir ve tarihi yanlış okumanın en yaygın yoludur.' },
    ],
    akilda:['Birincil: dönemin kendisi; ikincil: sonraki inceleme.', 'Kim, ne zaman, neden, kimin için?', 'Geçmiş kendi bağlamında okunur.'],
    kaynaklar:['Carr, Tarih Nedir? (1961)', 'Bloch, Tarihçinin Zanaatı (1949)'] },

  { id:'tarih-donemler', disc:'history', alan:'Tarih', ad:'Büyük dönemler ve dönüm noktaları', sure:7,
    giris:'Tarihi dönemlere ayırmak, uzun bir zaman çizgisini anlaşılır parçalara bölmeye yarar. Okullarda öğretilen klasik ayrım Avrupa merkezlidir ama Türkiye’de de yaygın kullanılır; sınırlarını bilerek kullanmak gerekir.',
    kazanim:['Klasik çağ ayrımını ve dönüm noktalarını bilir.', 'Dönemlemenin bir uzlaşım olduğunu açıklar.'],
    bolumler:[
      { baslik:'Klasik çağ ayrımı', metin:'Çağlar genellikle büyük bir dönüm noktasıyla başlatılır.',
        liste:['**Tarih öncesi:** yazının icadına kadar.', '**İlk Çağ:** yazının icadından (Sümerler, yaklaşık MÖ 3200) Batı Roma’nın yıkılışına (476).', '**Orta Çağ:** 476’dan İstanbul’un fethine (1453).', '**Yeni Çağ:** 1453’ten Fransız İhtilali’ne (1789).', '**Yakın Çağ:** 1789’dan günümüze.'],
        ornek:{ soru:'1453 ile 1789 arasında kaç yıl vardır ve bu aralık hangi çağdır?',
          cozum:['1789 − 1453 = 336 yıl.', 'Bu aralık klasik ayrımda Yeni Çağ’dır.'] } },
      { baslik:'Dönemleme bir uzlaşımdır', metin:'Bir yılın gece yarısında «Orta Çağ bitti» denmez; dönüşümler yavaş ve bölgeden bölgeye farklı olur. Çin, Hindistan ya da Amerika kıtası için 476 ya da 1453 belirleyici tarihler değildir. Dönemler bir haritadır, sınırlar ise bir uzlaşım.',
        dikkat:'Dönem adları («karanlık Orta Çağ» gibi) çoğu zaman sonraki kuşakların yargısını taşır; tarafsız betimleme değildir.' },
      { baslik:'Zaman çizgisi kurmak', metin:'Yeni bir konu çalışırken birkaç sabit tarih (çağ başları, büyük savaşlar, devrimler) üzerine kendi zaman çizgini kurmak, yeni öğrenilen olayların yerini bulmayı kolaylaştırır. ESP’nin Tarih bölümündeki zaman çizelgesi bu işi görür.' },
    ],
    akilda:['İlk Çağ ~MÖ 3200 → 476 → Orta Çağ → 1453 → Yeni Çağ → 1789 → Yakın Çağ.', 'Dönemleme bir uzlaşımdır ve Avrupa merkezlidir.', 'Sabit tarihler, yeni olaylara yer açar.'],
    kaynaklar:['Ortaöğretim tarih programları (MEB)', 'Le Goff, Faut-il vraiment découper l’histoire en tranches? (2014)'] },
];
