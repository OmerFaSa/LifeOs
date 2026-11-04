/* KARŞILAMA — modüle girerken italik selam ve o anki not; Bugün kapağı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/karsilama.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `karsilama.css`.
   ==================================================================

   Kullanıcı (2026-10-18): «modüle geçerken logo yerine italik bir yazıyla
   hoş geldin, merhaba, bugün zinde misin…; dili ayarlardan seçerim; altına
   küçük yazıyla o bölümün o anki notu; özelleştirilebilir selam ve
   mesajlar». Ve: «Bugün kısmı bambaşka, ana sayfa gibi olsun».

   Sözler:
     1. SELAM bir havuzdan seçilir: seçilen dil, günün saati (sabah, gün,
        akşam, gece), haftanın günü ve modülün kendi selamları; açılış sözü
        ile modülün sorusu birleşerek yüzlerce selam olur. Son görülen 40
        selam bir daha gelmez.
        «İyi misin?» gibi zorlama sorular havuzda yok (kullanıcı: «çok
        kasıtlı olur»). «Kendi selamlarım» seçiliyse yalnız onlar.
     2. NOT KURALDAN YA DA KULLANICIDAN. Sistem notu modülün kendi kural
        cümlesidir (Bugün'ün `sesli()` cümlesi, Siri'ye giden aynı cümle);
        modül onu her çizimde önbelleğe yazar. Dünden kalan cümle
        gösterilmez. Model burada hiçbir cümle yazmaz (AGENTS §1.1).
     3. AYAR TAŞINIR. `lifeos.karsilama` (localStorage) modüller arası
        geçişte taşınır (animasyon.js TASINAN); not önbelleği modülündür.
     4. KAPAK sayfanın başında, levhanın üstünde: italik selam, kural
        cümlesi (h1), en çok dört sayı (kesinliğiyle; ölçülmemiş «—»), tek
        eylem. Tarih yazmaz (kullanıcı, 2026-10-02: «böyle tarih yazmasın»). */
window.LIFEOS.PARCA.yazilar({
  'ortak.karsilama.hos-geldin':'Hoş geldin',
  'ortak.karsilama.tekrar-hos-geldin':'Tekrar hoş geldin',
  'ortak.karsilama.seni-gormek-guzel':'Seni görmek güzel',
  'ortak.karsilama.bugun-zinde-misin':'Bugün zinde misin?',
  'ortak.karsilama.hazirsan-baslayalim':'Hazırsan başlayalım',
  'ortak.karsilama.yeniden-merhaba':'Yeniden merhaba',
  'ortak.karsilama.kaldigin-yerden-devam':'Kaldığın yerden devam',
  'ortak.karsilama.hadi-bakalim':'Hadi bakalım',
  'ortak.karsilama.bir-adim-daha':'Bir adım daha',
  'ortak.karsilama.sakin-ve-odakli':'Sakin ve odaklı',
  'ortak.karsilama.yavas-ama-duzenli':'Yavaş ama düzenli',
  'ortak.karsilama.az-ama-her-gun':'Az ama her gün',
  'ortak.karsilama.kucuk-bir-adim-yeter':'Küçük bir adım yeter',
  'ortak.karsilama.nefes-al-baslayalim':'Nefes al, başlayalım',
  'ortak.karsilama.ne-guzel-geldin':'Ne güzel, geldin',
  'ortak.karsilama.bugune-birlikte-bakalim':'Bugüne birlikte bakalım',
  'ortak.karsilama.gun-senin':'Gün senin',
  'ortak.karsilama.bir-bakalim-neler-var':'Bir bakalım neler var',
  'ortak.karsilama.kisa-bir-tur-atalim':'Kısa bir tur atalım',
  'ortak.karsilama.odak-zamani':'Odak zamanı',
  'ortak.karsilama.her-gun-biraz':'Her gün biraz',
  'ortak.karsilama.kapi-acik-buyur':'Kapı açık, buyur',
  'ortak.karsilama.yine-buradasin-ne-guzel':'Yine buradasın, ne güzel',
  'ortak.karsilama.duzen-kuruluyor':'Düzen kuruluyor',
  'ortak.karsilama.bugun-de-buradayiz':'Bugün de buradayız',
  'ortak.karsilama.sade-bir-gun-olsun':'Sade bir gün olsun',
  'ortak.karsilama.adim-adim':'Adım adım',
  'ortak.karsilama.guzel-bir-sabah':'Güzel bir sabah',
  'ortak.karsilama.gunaydin-bugun-zinde-misin':'Günaydın, bugün zinde misin?',
  'ortak.karsilama.sabahin-hayirli-olsun':'Sabahın hayırlı olsun',
  'ortak.karsilama.erken-kalkmissin':'Erken kalkmışsın',
  'ortak.karsilama.kahven-hazir-mi':'Kahven hazır mı?',
  'ortak.karsilama.taze-bir-gun':'Taze bir gün',
  'ortak.karsilama.gunaydin-yeni-bir-sayfa':'Günaydın, yeni bir sayfa',
  'ortak.karsilama.gune-yumusak-bir-baslangic':'Güne yumuşak bir başlangıç',
  'ortak.karsilama.aydinlik-bir-sabah':'Aydınlık bir sabah',
  'ortak.karsilama.sabahin-sakin-saati':'Sabahın sakin saati',
  'ortak.karsilama.i-yi-gunler':'İyi günler',
  'ortak.karsilama.gunun-nasil-geciyor':'Günün nasıl geçiyor?',
  'ortak.karsilama.gunun-ortasindayiz':'Günün ortasındayız',
  'ortak.karsilama.kisa-bir-mola-mi':'Kısa bir mola mı?',
  'ortak.karsilama.gunun-yarisi-geride':'Günün yarısı geride',
  'ortak.karsilama.oglen-molasi-mi':'Öğlen molası mı?',
  'ortak.karsilama.gunun-geri-kalanina-bakalim':'Günün geri kalanına bakalım',
  'ortak.karsilama.i-yi-bir-ogleden-sonra':'İyi bir öğleden sonra',
  'ortak.karsilama.i-yi-aksamlar':'İyi akşamlar',
  'ortak.karsilama.aksamin-hayirli-olsun':'Akşamın hayırlı olsun',
  'ortak.karsilama.gunu-toparlama-vakti':'Günü toparlama vakti',
  'ortak.karsilama.aksam-sakinligi':'Akşam sakinliği',
  'ortak.karsilama.gunun-sonuna-yaklasiyoruz':'Günün sonuna yaklaşıyoruz',
  'ortak.karsilama.aksama-merhaba':'Akşama merhaba',
  'ortak.karsilama.gunu-kapatmadan-once':'Günü kapatmadan önce',
  'ortak.karsilama.hos-bir-aksam':'Hoş bir akşam',
  'ortak.karsilama.aksam-serinliginde':'Akşam serinliğinde',
  'ortak.karsilama.gec-saatlere-kaldin':'Geç saatlere kaldın',
  'ortak.karsilama.sakin-bir-gece':'Sakin bir gece',
  'ortak.karsilama.i-yi-geceler':'İyi geceler',
  'ortak.karsilama.gece-kusu':'Gece kuşu',
  'ortak.karsilama.gece-sessizligi':'Gece sessizliği',
  'ortak.karsilama.uyku-vakti-yaklasiyor':'Uyku vakti yaklaşıyor',
  'ortak.karsilama.bu-saatte-de-buradasin':'Bu saatte de buradasın',
  'ortak.karsilama.kisa-tutalim-gece-oldu':'Kısa tutalım, gece oldu',
  'ortak.karsilama.yeni-hafta-yeni-sayfa':'Yeni hafta, yeni sayfa',
  'ortak.karsilama.pazartesiye-merhaba':'Pazartesiye merhaba',
  'ortak.karsilama.haftanin-ilk-gunu':'Haftanın ilk günü',
  'ortak.karsilama.haftaya-yumusak-bir-giris':'Haftaya yumuşak bir giriş',
  'ortak.karsilama.cuma-geldi':'Cuma geldi',
  'ortak.karsilama.haftanin-son-duzlugu':'Haftanın son düzlüğü',
  'ortak.karsilama.hafta-sonu-kapida':'Hafta sonu kapıda',
  'ortak.karsilama.hayirli-cumalar':'Hayırlı cumalar',
  'ortak.karsilama.i-yi-hafta-sonlari':'İyi hafta sonları',
  'ortak.karsilama.hafta-sonu-ritmi':'Hafta sonu ritmi',
  'ortak.karsilama.hafta-sonuna-merhaba':'Hafta sonuna merhaba',
  'ortak.karsilama.hafta-sonu-sakinligi':'Hafta sonu sakinliği',
  'ortak.karsilama.bugun-hangi-konu':'Bugün hangi konu?',
  'ortak.karsilama.calismaya-hazir-misin':'Çalışmaya hazır mısın?',
  'ortak.karsilama.masaya-hos-geldin':'Masaya hoş geldin',
  'ortak.karsilama.kalem-kagit-hazir-mi':'Kalem kâğıt hazır mı?',
  'ortak.karsilama.bugun-neyi-bitiriyoruz':'Bugün neyi bitiriyoruz?',
  'ortak.karsilama.bir-konu-daha-kapanabilir':'Bir konu daha kapanabilir',
  'ortak.karsilama.soru-cozme-vakti':'Soru çözme vakti',
  'ortak.karsilama.defterini-ac':'Defterini aç',
  'ortak.karsilama.calisma-masasina-merhaba':'Çalışma masasına merhaba',
  'ortak.karsilama.sinav-yolunda-bir-gun-daha':'Sınav yolunda bir gün daha',
  'ortak.karsilama.bugunun-blogu-hazir-mi':'Bugünün bloğu hazır mı?',
  'ortak.karsilama.formuller-yerinde-mi':'Formüller yerinde mi?',
  'ortak.karsilama.paragraf-mi-problem-mi':'Paragraf mı, problem mi?',
  'ortak.karsilama.bir-deneme-bir-analiz':'Bir deneme, bir analiz',
  'ortak.karsilama.konular-sirada':'Konular sırada',
  'ortak.karsilama.yavas-yavas-konu-konu':'Yavaş yavaş, konu konu',
  'ortak.karsilama.sessizce-calisalim':'Sessizce çalışalım',
  'ortak.karsilama.tekrar-kartlari-bekliyor-ola':'Tekrar kartları bekliyor olabilir',
  'ortak.karsilama.bugun-kac-soru':'Bugün kaç soru?',
  'ortak.karsilama.odak-masasi-hazir':'Odak masası hazır',
  'ortak.karsilama.bugun-ne-yapmayi-planliyorsu':'Bugün ne yapmayı planlıyorsun?',
  'ortak.karsilama.bugun-kendine-nasil-bakacaks':'Bugün kendine nasıl bakacaksın?',
  'ortak.karsilama.bedenine-merhaba':'Bedenine merhaba',
  'ortak.karsilama.su-ictin-mi':'Su içtin mi?',
  'ortak.karsilama.biraz-hareket-iyi-gelir':'Biraz hareket iyi gelir',
  'ortak.karsilama.uykun-nasildi':'Uykun nasıldı?',
  'ortak.karsilama.nefesine-bir-bak':'Nefesine bir bak',
  'ortak.karsilama.esneme-vakti-mi':'Esneme vakti mi?',
  'ortak.karsilama.bir-bardak-suyla-basla':'Bir bardak suyla başla',
  'ortak.karsilama.yuruyus-havasi-mi':'Yürüyüş havası mı?',
  'ortak.karsilama.bugun-ne-yiyeceksin':'Bugün ne yiyeceksin?',
  'ortak.karsilama.kendine-iyi-bak':'Kendine iyi bak',
  'ortak.karsilama.dinlenmek-de-plana-dahil':'Dinlenmek de plana dahil',
  'ortak.karsilama.bugunun-ritmi-ne':'Bugünün ritmi ne?',
  'ortak.karsilama.bedeninin-sesini-dinle':'Bedeninin sesini dinle',
  'ortak.karsilama.bugun-antrenman-var-mi':'Bugün antrenman var mı?',
  'ortak.karsilama.hafif-bir-gun-mu-yogun':'Hafif bir gün mü, yoğun bir gün mü?',
  'ortak.karsilama.hareket-zamani':'Hareket zamanı',
  'ortak.karsilama.ogunlerine-bir-bakalim':'Öğünlerine bir bakalım',
  'ortak.karsilama.omuzlarini-gevset':'Omuzlarını gevşet',
  'ortak.karsilama.bugun-ne-dusunuyorsun':'Bugün ne düşünüyorsun?',
  'ortak.karsilama.bugun-neyi-merak-ediyorsun':'Bugün neyi merak ediyorsun?',
  'ortak.karsilama.yeni-bir-sey-ogrenelim-mi':'Yeni bir şey öğrenelim mi?',
  'ortak.karsilama.merakin-nerede-bugun':'Merakın nerede bugün?',
  'ortak.karsilama.bir-sayfa-bir-fikir':'Bir sayfa, bir fikir',
  'ortak.karsilama.bugun-hangi-alan':'Bugün hangi alan?',
  'ortak.karsilama.gitar-mi-kitap-mi':'Gitar mı, kitap mı?',
  'ortak.karsilama.biraz-yazi-biraz-okuma':'Biraz yazı, biraz okuma',
  'ortak.karsilama.kelimeler-seni-bekliyor':'Kelimeler seni bekliyor',
  'ortak.karsilama.bugun-neyi-derinlestiriyoruz':'Bugün neyi derinleştiriyoruz?',
  'ortak.karsilama.kucuk-bir-alistirma':'Küçük bir alıştırma?',
  'ortak.karsilama.zihnine-merhaba':'Zihnine merhaba',
  'ortak.karsilama.okuma-kosesine-hos-geldin':'Okuma köşesine hoş geldin',
  'ortak.karsilama.fikirler-icin-bir-yer':'Fikirler için bir yer',
  'ortak.karsilama.bugun-neyi-kesfedeceksin':'Bugün neyi keşfedeceksin?',
  'ortak.karsilama.bir-aliskanlik-daha':'Bir alışkanlık daha',
  'ortak.karsilama.yavas-ogren-derin-ogren':'Yavaş öğren, derin öğren',
  'ortak.karsilama.not-defterin-hazir':'Not defterin hazır',
  'ortak.karsilama.bugun-kimi-okuyorsun':'Bugün kimi okuyorsun?',
  'ortak.karsilama.bir-soru-bir-cevap':'Bir soru, bir cevap',
  'ortak.karsilama.merkeze-hos-geldin':'Merkeze hoş geldin',
  'ortak.karsilama.merkez-hazir':'Merkez hazır',
  'ortak.karsilama.uc-modul-tek-bakis':'Üç modül, tek bakış',
  'ortak.karsilama.her-sey-tek-yerde':'Her şey tek yerde',
  'ortak.karsilama.genel-tabloya-bakalim':'Genel tabloya bakalım',
  'ortak.karsilama.kumanda-masasina-hos-geldin':'Kumanda masasına hoş geldin',
  'ortak.karsilama.bugunun-ozeti-burada':'Bugünün özeti burada',
  'ortak.karsilama.hepsine-birden-bakalim':'Hepsine birden bakalım',
  'ortak.karsilama.merkeze-merhaba':'Merkeze merhaba',
  'ortak.karsilama.buyuk-resme-bakalim':'Büyük resme bakalım',
  'ortak.karsilama.butun-iplikler-burada':'Bütün iplikler burada',
  'ortak.karsilama.sakin-bir-kontrol-turu':'Sakin bir kontrol turu',
  'ortak.karsilama.bir-goz-atalim':'Bir göz atalım',
  'ortak.karsilama.duzenin-kalbi':'Düzenin kalbi',
  'ortak.karsilama.hepsi-yerinde-mi':'Hepsi yerinde mi?',
  'ortak.karsilama.bugun-neyi-yonetiyoruz':'Bugün neyi yönetiyoruz?',
  'ortak.karsilama.haftanin-tablosu-burada':'Haftanın tablosu burada',
  'ortak.karsilama.kusbakisi-bir-gun':'Kuşbakışı bir gün',
  'ortak.karsilama.welcome-back':'Welcome back',
  'ortak.karsilama.hi-there':'Hi there',
  'ortak.karsilama.good-to-see-you':'Good to see you',
  'ortak.karsilama.ready-for-today':'Ready for today?',
  'ortak.karsilama.let-s-begin':'Let’s begin',
  'ortak.karsilama.one-step-at-a-time':'One step at a time',
  'ortak.karsilama.little-and-often':'Little and often',
  'ortak.karsilama.back-again-nice':'Back again, nice',
  'ortak.karsilama.calm-and-focused':'Calm and focused',
  'ortak.karsilama.pick-up-where-you-left':'Pick up where you left off',
  'ortak.karsilama.here-we-go':'Here we go',
  'ortak.karsilama.good-morning':'Good morning',
  'ortak.karsilama.a-fresh-day':'A fresh day',
  'ortak.karsilama.coffee-ready':'Coffee ready?',
  'ortak.karsilama.morning-a-new-page':'Morning, a new page',
  'ortak.karsilama.good-afternoon':'Good afternoon',
  'ortak.karsilama.how-s-your-day-going':'How’s your day going?',
  'ortak.karsilama.halfway-there':'Halfway there',
  'ortak.karsilama.good-evening':'Good evening',
  'ortak.karsilama.time-to-wind-down':'Time to wind down',
  'ortak.karsilama.a-calm-evening':'A calm evening',
  'ortak.karsilama.working-late':'Working late?',
  'ortak.karsilama.a-quiet-night':'A quiet night',
  'ortak.karsilama.night-owl':'Night owl',
  'ortak.karsilama.new-week-new-page':'New week, new page',
  'ortak.karsilama.friday-at-last':'Friday at last',
  'ortak.karsilama.happy-weekend':'Happy weekend',
  'ortak.karsilama.what-are-we-studying-today':'What are we studying today?',
  'ortak.karsilama.ready-to-study':'Ready to study?',
  'ortak.karsilama.which-topic-today':'Which topic today?',
  'ortak.karsilama.time-for-some-questions':'Time for some questions',
  'ortak.karsilama.what-s-your-plan-for-today':'What’s your plan for today?',
  'ortak.karsilama.had-some-water':'Had some water?',
  'ortak.karsilama.how-did-you-sleep':'How did you sleep?',
  'ortak.karsilama.a-little-movement-helps':'A little movement helps',
  'ortak.karsilama.what-s-on-your-mind-today':'What’s on your mind today?',
  'ortak.karsilama.what-are-you-curious-about':'What are you curious about?',
  'ortak.karsilama.learn-something-new':'Learn something new?',
  'ortak.karsilama.guitar-or-book':'Guitar or book?',
  'ortak.karsilama.welcome-to-the-hub':'Welcome to the hub',
  'ortak.karsilama.everything-in-one-place':'Everything in one place',
  'ortak.karsilama.the-big-picture':'The big picture',
  'ortak.karsilama.three-modules-one-view':'Three modules, one view',
  'ortak.karsilama.willkommen-zuruck':'Willkommen zurück',
  'ortak.karsilama.schon-dich-zu-sehen':'Schön, dich zu sehen',
  'ortak.karsilama.bereit-fur-heute':'Bereit für heute?',
  'ortak.karsilama.los-geht-s':'Los geht’s',
  'ortak.karsilama.schritt-fur-schritt':'Schritt für Schritt',
  'ortak.karsilama.ruhig-und-fokussiert':'Ruhig und fokussiert',
  'ortak.karsilama.guten-morgen':'Guten Morgen',
  'ortak.karsilama.ein-frischer-tag':'Ein frischer Tag',
  'ortak.karsilama.guten-tag':'Guten Tag',
  'ortak.karsilama.wie-l-uft-dein-tag':'Wie läuft dein Tag?',
  'ortak.karsilama.guten-abend':'Guten Abend',
  'ortak.karsilama.ein-ruhiger-abend':'Ein ruhiger Abend',
  'ortak.karsilama.noch-wach':'Noch wach?',
  'ortak.karsilama.eine-stille-nacht':'Eine stille Nacht',
  'ortak.karsilama.neue-woche-neue-seite':'Neue Woche, neue Seite',
  'ortak.karsilama.endlich-freitag':'Endlich Freitag',
  'ortak.karsilama.schones-wochenende':'Schönes Wochenende',
  'ortak.karsilama.was-lernen-wir-heute':'Was lernen wir heute?',
  'ortak.karsilama.welches-thema-heute':'Welches Thema heute?',
  'ortak.karsilama.was-hast-du-heute-vor':'Was hast du heute vor?',
  'ortak.karsilama.schon-wasser-getrunken':'Schon Wasser getrunken?',
  'ortak.karsilama.was-besch-ftigt-dich-heute':'Was beschäftigt dich heute?',
  'ortak.karsilama.etwas-neues-lernen':'Etwas Neues lernen?',
  'ortak.karsilama.willkommen-in-der-zentrale':'Willkommen in der Zentrale',
  'ortak.karsilama.alles-an-einem-ort':'Alles an einem Ort',
  'ortak.karsilama.bon-retour':'Bon retour',
  'ortak.karsilama.content-de-te-revoir':'Content de te revoir',
  'ortak.karsilama.pr-t-pour-aujourd-hui':'Prêt pour aujourd’hui ?',
  'ortak.karsilama.on-y-va':'On y va',
  'ortak.karsilama.pas-pas':'Pas à pas',
  'ortak.karsilama.calme-et-concentr':'Calme et concentré',
  'ortak.karsilama.une-nouvelle-journ-e':'Une nouvelle journée',
  'ortak.karsilama.bon-apr-s-midi':'Bon après-midi',
  'ortak.karsilama.comment-se-passe-ta-journ-e':'Comment se passe ta journée ?',
  'ortak.karsilama.une-soir-e-calme':'Une soirée calme',
  'ortak.karsilama.encore-debout':'Encore debout ?',
  'ortak.karsilama.une-nuit-tranquille':'Une nuit tranquille',
  'ortak.karsilama.nouvelle-semaine-nouvelle-pa':'Nouvelle semaine, nouvelle page',
  'ortak.karsilama.enfin-vendredi':'Enfin vendredi',
  'ortak.karsilama.bon-week-end':'Bon week-end',
  'ortak.karsilama.on-tudie-quoi-aujourd-hui':'On étudie quoi aujourd’hui ?',
  'ortak.karsilama.quel-sujet-aujourd-hui':'Quel sujet aujourd’hui ?',
  'ortak.karsilama.qu-as-tu-pr-vu-aujourd-hui':'Qu’as-tu prévu aujourd’hui ?',
  'ortak.karsilama.tu-as-bu-de-l-eau':'Tu as bu de l’eau ?',
  'ortak.karsilama.apprendre-quelque-chose':'Apprendre quelque chose ?',
  'ortak.karsilama.bienvenue-au-centre':'Bienvenue au centre',
  'ortak.karsilama.tout-au-m-me-endroit':'Tout au même endroit',
  'ortak.karsilama.bienvenido-de-nuevo':'Bienvenido de nuevo',
  'ortak.karsilama.qu-bueno-verte':'Qué bueno verte',
  'ortak.karsilama.vamos-all':'Vamos allá',
  'ortak.karsilama.paso-a-paso':'Paso a paso',
  'ortak.karsilama.con-calma-y-foco':'Con calma y foco',
  'ortak.karsilama.buenos-d-as':'Buenos días',
  'ortak.karsilama.un-d-a-nuevo':'Un día nuevo',
  'ortak.karsilama.buenas-tardes':'Buenas tardes',
  'ortak.karsilama.una-tarde-tranquila':'Una tarde tranquila',
  'ortak.karsilama.una-noche-tranquila':'Una noche tranquila',
  'ortak.karsilama.nueva-semana-nueva-p-gina':'Nueva semana, nueva página',
  'ortak.karsilama.por-fin-viernes':'Por fin viernes',
  'ortak.karsilama.buen-fin-de-semana':'Buen fin de semana',
  'ortak.karsilama.bienvenido-al-centro':'Bienvenido al centro',
  'ortak.karsilama.todo-en-un-lugar':'Todo en un lugar',
  'ortak.karsilama.karsilama-dili':'Karşılama dili',
  'ortak.karsilama.selam':'Selam',
  'ortak.karsilama.turlu-turlu':'Türlü türlü',
  'ortak.karsilama.kendi-selamlarim':'Kendi selamlarım',
  'ortak.karsilama.kendi-selamlarin':'Kendi selamların',
  'ortak.karsilama.her-satira-bir-tane':'her satıra bir tane',
  'ortak.karsilama.altindaki-not':'Altındaki not',
  'ortak.karsilama.sistemin-notu':'Sistemin notu',
  'ortak.karsilama.kendi-notlarim':'Kendi notlarım',
  'ortak.karsilama.bu-bolum-icin-kendi-notlarin':'Bu bölüm için kendi notların',
});


window.LIFEOS = window.LIFEOS || {};

LIFEOS.KARSILAMA = (function(){
  'use strict';
  const AYAR = 'lifeos.karsilama';
  const NOT = 'lifeos.karsilama.not';
  const SON = 'lifeos.karsilama.son';
  const EN_COK = 12, EN_UZUN = 60;
  const DILLER = Object.freeze([
    { id:'tr', ad:'Türkçe' }, { id:'en', ad:'English' }, { id:'de', ad:'Deutsch' },
    { id:'fr', ad:'Français' }, { id:'es', ad:'Español' },
  ]);
  const MODULLER = ['ays', 'spi', 'esp'];

  /* Havuz: dil → { genel, sabah, gun, aksam, gece, pzt, cuma, hs, ays, spi, esp, hkm,
     on:{ genel, sabah, … }, ek:{ ays, … } }. Tek selamların yanında BİRLEŞİK
     selam da var: açılış sözü («Günaydın») + modülün küçük harfli sorusu
     («bugün hangi konu?»). Kullanıcı (2026-10-18): «türlü türlü olsun,
     aynısını bir daha görmek zor bir ihtimal olsun». Son görülen 40 selam
     bir daha seçilmez (acilis). `hkm` Merkez'indir: Merkez tek dosyadır,
     bu listeyi kopyalar; HKM/tests/test_yuz.py ikisinin aynı olduğunu sınar. */
  const HAVUZ = {
    tr:{
      genel:[yz('ortak.karsilama.hos-geldin'), 'Merhaba', 'Merhabalar', yz('ortak.karsilama.tekrar-hos-geldin'), yz('ortak.karsilama.seni-gormek-guzel'), yz('ortak.karsilama.bugun-zinde-misin'),
        yz('ortak.karsilama.hazirsan-baslayalim'), 'Selam', yz('ortak.karsilama.yeniden-merhaba'), yz('ortak.karsilama.kaldigin-yerden-devam'), yz('ortak.karsilama.hadi-bakalim'), yz('ortak.karsilama.bir-adim-daha'),
        yz('ortak.karsilama.sakin-ve-odakli'), yz('ortak.karsilama.yavas-ama-duzenli'), yz('ortak.karsilama.az-ama-her-gun'), yz('ortak.karsilama.kucuk-bir-adim-yeter'), yz('ortak.karsilama.nefes-al-baslayalim'),
        yz('ortak.karsilama.ne-guzel-geldin'), yz('ortak.karsilama.bugune-birlikte-bakalim'), yz('ortak.karsilama.gun-senin'), yz('ortak.karsilama.bir-bakalim-neler-var'), yz('ortak.karsilama.kisa-bir-tur-atalim'),
        yz('ortak.karsilama.odak-zamani'), yz('ortak.karsilama.her-gun-biraz'), yz('ortak.karsilama.kapi-acik-buyur'), yz('ortak.karsilama.yine-buradasin-ne-guzel'), yz('ortak.karsilama.duzen-kuruluyor'),
        yz('ortak.karsilama.bugun-de-buradayiz'), yz('ortak.karsilama.sade-bir-gun-olsun'), yz('ortak.karsilama.adim-adim')],
      sabah:['Günaydın', yz('ortak.karsilama.guzel-bir-sabah'), yz('ortak.karsilama.gunaydin-bugun-zinde-misin'), yz('ortak.karsilama.sabahin-hayirli-olsun'), yz('ortak.karsilama.erken-kalkmissin'),
        yz('ortak.karsilama.kahven-hazir-mi'), yz('ortak.karsilama.taze-bir-gun'), yz('ortak.karsilama.gunaydin-yeni-bir-sayfa'), yz('ortak.karsilama.gune-yumusak-bir-baslangic'), yz('ortak.karsilama.aydinlik-bir-sabah'),
        yz('ortak.karsilama.sabahin-sakin-saati')],
      gun:[yz('ortak.karsilama.i-yi-gunler'), yz('ortak.karsilama.gunun-nasil-geciyor'), yz('ortak.karsilama.gunun-ortasindayiz'), 'Tünaydın', yz('ortak.karsilama.kisa-bir-mola-mi'), yz('ortak.karsilama.gunun-yarisi-geride'),
        yz('ortak.karsilama.oglen-molasi-mi'), yz('ortak.karsilama.gunun-geri-kalanina-bakalim'), yz('ortak.karsilama.i-yi-bir-ogleden-sonra')],
      aksam:[yz('ortak.karsilama.i-yi-aksamlar'), yz('ortak.karsilama.aksamin-hayirli-olsun'), yz('ortak.karsilama.gunu-toparlama-vakti'), yz('ortak.karsilama.aksam-sakinligi'), yz('ortak.karsilama.gunun-sonuna-yaklasiyoruz'),
        yz('ortak.karsilama.aksama-merhaba'), yz('ortak.karsilama.gunu-kapatmadan-once'), yz('ortak.karsilama.hos-bir-aksam'), yz('ortak.karsilama.aksam-serinliginde')],
      gece:[yz('ortak.karsilama.gec-saatlere-kaldin'), yz('ortak.karsilama.sakin-bir-gece'), yz('ortak.karsilama.i-yi-geceler'), yz('ortak.karsilama.gece-kusu'), yz('ortak.karsilama.gece-sessizligi'), yz('ortak.karsilama.uyku-vakti-yaklasiyor'),
        yz('ortak.karsilama.bu-saatte-de-buradasin'), yz('ortak.karsilama.kisa-tutalim-gece-oldu')],
      pzt:[yz('ortak.karsilama.yeni-hafta-yeni-sayfa'), yz('ortak.karsilama.pazartesiye-merhaba'), yz('ortak.karsilama.haftanin-ilk-gunu'), yz('ortak.karsilama.haftaya-yumusak-bir-giris')],
      cuma:[yz('ortak.karsilama.cuma-geldi'), yz('ortak.karsilama.haftanin-son-duzlugu'), yz('ortak.karsilama.hafta-sonu-kapida'), yz('ortak.karsilama.hayirli-cumalar')],
      hs:[yz('ortak.karsilama.i-yi-hafta-sonlari'), yz('ortak.karsilama.hafta-sonu-ritmi'), yz('ortak.karsilama.hafta-sonuna-merhaba'), yz('ortak.karsilama.hafta-sonu-sakinligi')],
      ays:[yz('ortak.karsilama.bugun-hangi-konu'), yz('ortak.karsilama.calismaya-hazir-misin'), yz('ortak.karsilama.masaya-hos-geldin'), yz('ortak.karsilama.kalem-kagit-hazir-mi'), yz('ortak.karsilama.bugun-neyi-bitiriyoruz'),
        yz('ortak.karsilama.bir-konu-daha-kapanabilir'), yz('ortak.karsilama.soru-cozme-vakti'), yz('ortak.karsilama.defterini-ac'), yz('ortak.karsilama.calisma-masasina-merhaba'), yz('ortak.karsilama.sinav-yolunda-bir-gun-daha'),
        yz('ortak.karsilama.bugunun-blogu-hazir-mi'), yz('ortak.karsilama.formuller-yerinde-mi'), yz('ortak.karsilama.paragraf-mi-problem-mi'), yz('ortak.karsilama.bir-deneme-bir-analiz'),
        yz('ortak.karsilama.konular-sirada'), yz('ortak.karsilama.yavas-yavas-konu-konu'), yz('ortak.karsilama.sessizce-calisalim'), yz('ortak.karsilama.tekrar-kartlari-bekliyor-ola'),
        yz('ortak.karsilama.bugun-kac-soru'), yz('ortak.karsilama.odak-masasi-hazir')],
      spi:[yz('ortak.karsilama.bugun-ne-yapmayi-planliyorsu'), yz('ortak.karsilama.bugun-kendine-nasil-bakacaks'), yz('ortak.karsilama.bedenine-merhaba'), yz('ortak.karsilama.su-ictin-mi'),
        yz('ortak.karsilama.biraz-hareket-iyi-gelir'), yz('ortak.karsilama.uykun-nasildi'), yz('ortak.karsilama.nefesine-bir-bak'), yz('ortak.karsilama.esneme-vakti-mi'), yz('ortak.karsilama.bir-bardak-suyla-basla'),
        yz('ortak.karsilama.yuruyus-havasi-mi'), yz('ortak.karsilama.bugun-ne-yiyeceksin'), yz('ortak.karsilama.kendine-iyi-bak'), yz('ortak.karsilama.dinlenmek-de-plana-dahil'), yz('ortak.karsilama.bugunun-ritmi-ne'),
        yz('ortak.karsilama.bedeninin-sesini-dinle'), yz('ortak.karsilama.bugun-antrenman-var-mi'), yz('ortak.karsilama.hafif-bir-gun-mu-yogun'), yz('ortak.karsilama.hareket-zamani'),
        yz('ortak.karsilama.ogunlerine-bir-bakalim'), yz('ortak.karsilama.omuzlarini-gevset')],
      esp:[yz('ortak.karsilama.bugun-ne-dusunuyorsun'), yz('ortak.karsilama.bugun-neyi-merak-ediyorsun'), yz('ortak.karsilama.yeni-bir-sey-ogrenelim-mi'), yz('ortak.karsilama.merakin-nerede-bugun'),
        yz('ortak.karsilama.bir-sayfa-bir-fikir'), yz('ortak.karsilama.bugun-hangi-alan'), yz('ortak.karsilama.gitar-mi-kitap-mi'), yz('ortak.karsilama.biraz-yazi-biraz-okuma'), yz('ortak.karsilama.kelimeler-seni-bekliyor'),
        yz('ortak.karsilama.bugun-neyi-derinlestiriyoruz'), yz('ortak.karsilama.kucuk-bir-alistirma'), yz('ortak.karsilama.zihnine-merhaba'), yz('ortak.karsilama.okuma-kosesine-hos-geldin'),
        yz('ortak.karsilama.fikirler-icin-bir-yer'), yz('ortak.karsilama.bugun-neyi-kesfedeceksin'), yz('ortak.karsilama.bir-aliskanlik-daha'), yz('ortak.karsilama.yavas-ogren-derin-ogren'),
        yz('ortak.karsilama.not-defterin-hazir'), yz('ortak.karsilama.bugun-kimi-okuyorsun'), yz('ortak.karsilama.bir-soru-bir-cevap')],
      hkm:[yz('ortak.karsilama.merkeze-hos-geldin'), yz('ortak.karsilama.merkez-hazir'), yz('ortak.karsilama.uc-modul-tek-bakis'), yz('ortak.karsilama.her-sey-tek-yerde'), yz('ortak.karsilama.genel-tabloya-bakalim'),
        yz('ortak.karsilama.kumanda-masasina-hos-geldin'), yz('ortak.karsilama.bugunun-ozeti-burada'), yz('ortak.karsilama.hepsine-birden-bakalim'), yz('ortak.karsilama.merkeze-merhaba'),
        yz('ortak.karsilama.buyuk-resme-bakalim'), yz('ortak.karsilama.butun-iplikler-burada'), yz('ortak.karsilama.sakin-bir-kontrol-turu'), yz('ortak.karsilama.bir-goz-atalim'), yz('ortak.karsilama.duzenin-kalbi'),
        yz('ortak.karsilama.hepsi-yerinde-mi'), yz('ortak.karsilama.bugun-neyi-yonetiyoruz'), yz('ortak.karsilama.haftanin-tablosu-burada'), yz('ortak.karsilama.kusbakisi-bir-gun')],
      on:{ genel:['Merhaba', 'Selam', yz('ortak.karsilama.hos-geldin'), yz('ortak.karsilama.tekrar-hos-geldin')], sabah:['Günaydın'], gun:[yz('ortak.karsilama.i-yi-gunler'), 'Tünaydın'],
        aksam:[yz('ortak.karsilama.i-yi-aksamlar')], gece:[yz('ortak.karsilama.i-yi-geceler')] },
      ek:{
        ays:['bugün hangi konu?', 'çalışmaya hazır mısın?', 'bugün neyi bitiriyoruz?', 'soru çözme vakti', 'defterini aç',
          'tekrar zamanı olabilir', 'bugün kaç soru?', 'masa hazır', 'konular sırada', 'bir konu daha kapanabilir'],
        spi:['bugün ne yapmayı planlıyorsun?', 'su içtin mi?', 'uykun nasıldı?', 'biraz hareket iyi gelir', 'bugün ne yiyeceksin?',
          'yürüyüş havası mı?', 'kendine iyi bak', 'bugünün ritmi ne?', 'nefesine bir bak', 'esneme vakti mi?'],
        esp:['bugün ne düşünüyorsun?', 'bugün neyi merak ediyorsun?', 'yeni bir şey öğrenelim mi?', 'bugün hangi alan?',
          'bugün neyi keşfedeceksin?', 'kelimeler seni bekliyor', 'bugün kimi okuyorsun?', 'küçük bir alıştırma?',
          'okuma köşesi hazır', 'merakın nerede bugün?'],
        hkm:['merkez hazır', 'genel tabloya bakalım', 'kuşbakışı bir gün', 'bugünün özeti burada', 'büyük resme bakalım',
          'bir göz atalım', 'hepsi yerinde mi?', 'bugün neyi yönetiyoruz?'],
      } },
    en:{ genel:[yz('ortak.karsilama.welcome-back'), 'Hello', yz('ortak.karsilama.hi-there'), yz('ortak.karsilama.good-to-see-you'), yz('ortak.karsilama.ready-for-today'), yz('ortak.karsilama.let-s-begin'), yz('ortak.karsilama.one-step-at-a-time'),
        yz('ortak.karsilama.little-and-often'), yz('ortak.karsilama.back-again-nice'), yz('ortak.karsilama.calm-and-focused'), yz('ortak.karsilama.pick-up-where-you-left'), yz('ortak.karsilama.here-we-go')],
      sabah:[yz('ortak.karsilama.good-morning'), yz('ortak.karsilama.a-fresh-day'), yz('ortak.karsilama.coffee-ready'), yz('ortak.karsilama.morning-a-new-page')], gun:[yz('ortak.karsilama.good-afternoon'), yz('ortak.karsilama.how-s-your-day-going'), yz('ortak.karsilama.halfway-there')],
      aksam:[yz('ortak.karsilama.good-evening'), yz('ortak.karsilama.time-to-wind-down'), yz('ortak.karsilama.a-calm-evening')], gece:[yz('ortak.karsilama.working-late'), yz('ortak.karsilama.a-quiet-night'), yz('ortak.karsilama.night-owl')],
      pzt:[yz('ortak.karsilama.new-week-new-page')], cuma:[yz('ortak.karsilama.friday-at-last')], hs:[yz('ortak.karsilama.happy-weekend')],
      ays:[yz('ortak.karsilama.what-are-we-studying-today'), yz('ortak.karsilama.ready-to-study'), yz('ortak.karsilama.which-topic-today'), yz('ortak.karsilama.time-for-some-questions')],
      spi:[yz('ortak.karsilama.what-s-your-plan-for-today'), yz('ortak.karsilama.had-some-water'), yz('ortak.karsilama.how-did-you-sleep'), yz('ortak.karsilama.a-little-movement-helps')],
      esp:[yz('ortak.karsilama.what-s-on-your-mind-today'), yz('ortak.karsilama.what-are-you-curious-about'), yz('ortak.karsilama.learn-something-new'), yz('ortak.karsilama.guitar-or-book')],
      hkm:[yz('ortak.karsilama.welcome-to-the-hub'), yz('ortak.karsilama.everything-in-one-place'), yz('ortak.karsilama.the-big-picture'), yz('ortak.karsilama.three-modules-one-view')] },
    de:{ genel:[yz('ortak.karsilama.willkommen-zuruck'), 'Hallo', yz('ortak.karsilama.schon-dich-zu-sehen'), yz('ortak.karsilama.bereit-fur-heute'), yz('ortak.karsilama.los-geht-s'), yz('ortak.karsilama.schritt-fur-schritt'), yz('ortak.karsilama.ruhig-und-fokussiert')],
      sabah:[yz('ortak.karsilama.guten-morgen'), yz('ortak.karsilama.ein-frischer-tag')], gun:[yz('ortak.karsilama.guten-tag'), yz('ortak.karsilama.wie-l-uft-dein-tag')], aksam:[yz('ortak.karsilama.guten-abend'), yz('ortak.karsilama.ein-ruhiger-abend')],
      gece:[yz('ortak.karsilama.noch-wach'), yz('ortak.karsilama.eine-stille-nacht')], pzt:[yz('ortak.karsilama.neue-woche-neue-seite')], cuma:[yz('ortak.karsilama.endlich-freitag')], hs:[yz('ortak.karsilama.schones-wochenende')],
      ays:[yz('ortak.karsilama.was-lernen-wir-heute'), yz('ortak.karsilama.welches-thema-heute')], spi:[yz('ortak.karsilama.was-hast-du-heute-vor'), yz('ortak.karsilama.schon-wasser-getrunken')],
      esp:[yz('ortak.karsilama.was-besch-ftigt-dich-heute'), yz('ortak.karsilama.etwas-neues-lernen')], hkm:[yz('ortak.karsilama.willkommen-in-der-zentrale'), yz('ortak.karsilama.alles-an-einem-ort')] },
    fr:{ genel:[yz('ortak.karsilama.bon-retour'), 'Bonjour', yz('ortak.karsilama.content-de-te-revoir'), yz('ortak.karsilama.pr-t-pour-aujourd-hui'), yz('ortak.karsilama.on-y-va'), yz('ortak.karsilama.pas-pas'), yz('ortak.karsilama.calme-et-concentr')],
      sabah:['Bonjour', yz('ortak.karsilama.une-nouvelle-journ-e')], gun:[yz('ortak.karsilama.bon-apr-s-midi'), yz('ortak.karsilama.comment-se-passe-ta-journ-e')], aksam:['Bonsoir', yz('ortak.karsilama.une-soir-e-calme')],
      gece:[yz('ortak.karsilama.encore-debout'), yz('ortak.karsilama.une-nuit-tranquille')], pzt:[yz('ortak.karsilama.nouvelle-semaine-nouvelle-pa')], cuma:[yz('ortak.karsilama.enfin-vendredi')], hs:[yz('ortak.karsilama.bon-week-end')],
      ays:[yz('ortak.karsilama.on-tudie-quoi-aujourd-hui'), yz('ortak.karsilama.quel-sujet-aujourd-hui')], spi:[yz('ortak.karsilama.qu-as-tu-pr-vu-aujourd-hui'), yz('ortak.karsilama.tu-as-bu-de-l-eau')],
      esp:['À quoi penses-tu aujourd’hui ?', yz('ortak.karsilama.apprendre-quelque-chose')], hkm:[yz('ortak.karsilama.bienvenue-au-centre'), yz('ortak.karsilama.tout-au-m-me-endroit')] },
    es:{ genel:[yz('ortak.karsilama.bienvenido-de-nuevo'), 'Hola', yz('ortak.karsilama.qu-bueno-verte'), '¿Listo para hoy?', yz('ortak.karsilama.vamos-all'), yz('ortak.karsilama.paso-a-paso'), yz('ortak.karsilama.con-calma-y-foco')],
      sabah:[yz('ortak.karsilama.buenos-d-as'), yz('ortak.karsilama.un-d-a-nuevo')], gun:[yz('ortak.karsilama.buenas-tardes'), '¿Qué tal tu día?'], aksam:[yz('ortak.karsilama.buenas-tardes'), yz('ortak.karsilama.una-tarde-tranquila')],
      gece:['¿Trasnochando?', yz('ortak.karsilama.una-noche-tranquila')], pzt:[yz('ortak.karsilama.nueva-semana-nueva-p-gina')], cuma:[yz('ortak.karsilama.por-fin-viernes')], hs:[yz('ortak.karsilama.buen-fin-de-semana')],
      ays:['¿Qué estudiamos hoy?', '¿Qué tema hoy?'], spi:['¿Qué planeas hoy?', '¿Ya tomaste agua?'],
      esp:['¿Qué tienes en mente hoy?', '¿Aprender algo nuevo?'], hkm:[yz('ortak.karsilama.bienvenido-al-centro'), yz('ortak.karsilama.todo-en-un-lugar')] },
  };
  const HATIRA = 40;

  const kac = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function vakit(d){
    const s = (d || new Date()).getHours();
    return s >= 5 && s < 11 ? 'sabah' : s >= 11 && s < 17 ? 'gun' : s >= 17 && s < 22 ? 'aksam' : 'gece';
  }
  function liste(l){
    const temiz = [];
    (Array.isArray(l) ? l : []).forEach(x => {
      const t = String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, EN_UZUN);
      if(t && temiz.indexOf(t) < 0 && temiz.length < EN_COK) temiz.push(t);
    });
    return temiz;
  }

  /* ------------------------------------------------------------ ayar */

  function ayarOku(v){
    v = v && typeof v === 'object' ? v : {};
    const notlar = {};
    MODULLER.forEach(m => { notlar[m] = liste(v.notlar && v.notlar[m]); });
    return {
      dil:DILLER.some(d => d.id === v.dil) ? v.dil : 'tr',
      selam:v.selam === 'kendi' ? 'kendi' : 'karisik',
      kendi:liste(v.kendi),
      not:['sistem', 'kendi', 'ikisi', 'kapali'].indexOf(v.not) >= 0 ? v.not : 'sistem',
      notlar,
    };
  }
  function depo(){ try{ return window.localStorage; }catch(e){ return null; } }
  function oku(anahtar){ try{ const d = depo(); return d ? JSON.parse(d.getItem(anahtar) || 'null') : null; }catch(e){ return null; } }
  function yaz(anahtar, v){ try{ const d = depo(); if(d) d.setItem(anahtar, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function ayar(){ return ayarOku(oku(AYAR)); }
  function ayarYaz(v){ const a = ayarOku(v); yaz(AYAR, a); return a; }

  /* ------------------------------------------------------------ selam */

  function gunTuru(d){
    const g = (d || new Date()).getDay();
    return g === 1 ? 'pzt' : g === 5 ? 'cuma' : g === 0 || g === 6 ? 'hs' : '';
  }
  function havuz(o){
    const H = HAVUZ[o.dil] || HAVUZ.tr, v = vakit(o.simdi), gt = gunTuru(o.simdi);
    const tek = [].concat(H.genel, H[v] || [], gt ? H[gt] || [] : [], H[o.modul] || []);
    const on = H.on ? [].concat(H.on.genel || [], H.on[v] || []) : [];
    const ek = H.ek && H.ek[o.modul] || [];
    const bir = [];
    on.forEach(a => ek.forEach(b => { if(b.indexOf(',') < 0) bir.push(a + ', ' + b); }));
    const hepsi = [];
    tek.concat(bir).forEach(x => { if(hepsi.indexOf(x) < 0) hepsi.push(x); });
    return hepsi;
  }
  /* once: son görülen selam ya da son görülenlerin listesi; hepsi
     görülmüşse yalnız en sonuncusu dışarıda kalır. */
  function sec(l, tohum, once){
    if(!l.length) return '';
    const gorulen = Array.isArray(once) ? once : once ? [once] : [];
    let aday = l.filter(x => gorulen.indexOf(x) < 0);
    if(!aday.length) aday = l.length > 1 ? l.filter(x => x !== gorulen[gorulen.length - 1]) : l;
    const i = Math.abs(Math.floor(Number(tohum) || 0)) % aday.length;
    return aday[i];
  }
  /* o: { ayar, modul, simdi, tohum, once } */
  function selam(o){
    const a = ayarOku(o.ayar);
    const l = a.selam === 'kendi' && a.kendi.length ? a.kendi : havuz({ dil:a.dil, modul:o.modul, simdi:o.simdi });
    return sec(l, o.tohum == null ? Math.random() * 1e9 : o.tohum, o.once);
  }

  /* ------------------------------------------------------------ not */

  /* o: { ayar, modul, onbellek:{ metin, gun }, bugun, tohum } */
  function not(o){
    const a = ayarOku(o.ayar);
    const sistem = o.onbellek && o.onbellek.gun === o.bugun && o.onbellek.metin ? String(o.onbellek.metin) : '';
    const kendi = sec(a.notlar[o.modul] || [], o.tohum == null ? Date.now() / 1009 : o.tohum, '');
    if(a.not === 'kapali') return '';
    if(a.not === 'sistem') return sistem;
    if(a.not === 'kendi') return kendi;
    return sistem || kendi;
  }
  /* Modül çağırır: Bugün'ün kural cümlesi (sesli) önbelleğe. */
  function notYaz(metin, gun){ return yaz(NOT, { metin:String(metin || '').slice(0, 200), gun }); }

  function bugunISO(d){
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Perde için: selam + not, bir açılışta bir kez (sonraki çağrı aynısını verir). */
  let bu = null;
  function acilis(modul){
    if(bu && bu.modul === modul) return bu;
    const a = ayar(), simdi = new Date();
    const son = oku(SON) || {};
    const once = Array.isArray(son[modul]) ? son[modul].filter(x => typeof x === 'string') : son[modul] ? [String(son[modul])] : [];
    const s = selam({ ayar:a, modul, simdi, once });
    son[modul] = once.concat([s]).slice(-HATIRA);
    yaz(SON, son);
    bu = { modul, selam:s, not:not({ ayar:a, modul, onbellek:oku(NOT), bugun:bugunISO(simdi) }), dil:a.dil };
    return bu;
  }
  /* Perdenin durağan kabına yazar (perde.html); kap yoksa sessiz. */
  function perdeyeYaz(kap, modul){
    if(!kap) return false;
    const k = acilis(modul);
    const s = kap.querySelector('.karsilama__selam'), n = kap.querySelector('.karsilama__not');
    if(s){ s.textContent = k.selam; s.setAttribute('lang', k.dil); }
    if(n){ n.textContent = k.not; n.hidden = !k.not; }
    kap.classList.add('is-hazir');
    return true;
  }

  /* ------------------------------------------------------------ kapak */

  const KESINLIK = { measured:'ölçüldü', computed:'hesaplandı', estimated:'tahmin', veri_yok:'veri yok' };
  /* GÖRSEL PANO (kullanıcı, 2026-10-20: «genel sistem arayüzünü daha
     görselleştirip daha güzel yap»; seçtiği yön: halka göstergeli renkli
     karolar). Her sayı bir karo: simge, ad, değer. Modül HEDEFİ biliyorsa
     (`oran`, ör. su 2000 ml eşiğinin ne kadarı) değerin çevresinde halka
     çizilir; bilmiyorsa halka yok — hedef uydurulmaz. `seri` son günlerin
     kaydıysa altta küçük sütunlar; girilmemiş gün nokta (sıfır değil). */
  const SIMGE = {
    uyku:'<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    su:'<path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
    ogun:'<path d="M7 3v7.5M5 3v5a2 2 0 0 0 4 0V3M7 10.5V21M17.5 3c-2 2-2.5 5-2.5 8h2.5v10"/>',
    hareket:'<path d="M3 12.5h4l2.5-6 4.5 12 2.5-6H21"/>',
    oturum:'<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 13L12 17.5 20.5 13"/>',
    sure:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    hatirlatici:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    blok:'<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    kart:'<rect x="4" y="7" width="12.5" height="13" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v11"/>',
    seri:'<path d="M12 3c1 3.6 5 5.6 5 10.2a5 5 0 0 1-10 0c0-2.6 1.5-3.9 2.6-5.1.3 1.6 1 2.6 2 3.1C11.6 8.2 12 5.8 12 3z"/>',
    sinav:'<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
    nokta:'<circle cx="12" cy="12" r="3.5"/>',
  };
  const SIMGE_AD = { 'uyku':'uyku', 'su':'su', 'öğün':'ogun', 'hareket':'hareket', 'oturum':'oturum', 'süre':'sure',
    'hatırlatıcı':'hatirlatici', 'blok':'blok', 'tekrar kartı':'kart', 'tekrar':'kart', 'seri':'seri', 'sınava':'sinav' };
  const simgeOf = x => SIMGE[x.simge] ? x.simge : (SIMGE_AD[String(x.ad || '').toLocaleLowerCase('tr-TR')] || 'nokta');
  const svgS = (ic, cls) => '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + SIMGE[ic] + '</svg>';
  function halka(oran){
    const r = 25, c = 2 * Math.PI * r, o = Math.max(0, Math.min(1, oran));
    return '<svg class="kapak__halka" viewBox="0 0 60 60" aria-hidden="true"><circle class="kapak__halka-iz" cx="30" cy="30" r="' + r + '"/>'
      + (o > 0 ? '<circle class="kapak__halka-dolu" cx="30" cy="30" r="' + r + '" stroke-dasharray="' + (c * o).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 30 30)"/>' : '') + '</svg>';
  }
  function sutunlar(l){
    const v = (l || []).map(x => x == null || !isFinite(Number(x)) ? null : Number(x));
    if(!v.some(x => x != null)) return '';
    const en = Math.max(1e-9, ...v.filter(x => x != null)), w = 6, ara = 4, h = 22;
    return '<svg class="kapak__sutun" viewBox="0 0 ' + (v.length * (w + ara) - ara) + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">'
      + v.map((x, i) => x == null
        ? '<circle cx="' + (i * (w + ara) + w / 2) + '" cy="' + (h - 1.5) + '" r="1.3" class="kapak__sutun-bos"/>'
        : '<rect x="' + i * (w + ara) + '" y="' + (h - Math.max(2, x / en * h)).toFixed(1) + '" width="' + w + '" height="' + Math.max(2, x / en * h).toFixed(1) + '" rx="2"'
          + (i === v.length - 1 ? ' class="is-son"' : '') + '/>').join('') + '</svg>';
  }
  /* o: { modul, selam, cumle, sayilar:[{ ad, deger, birim, kesinlik, oran?, halka?, seri?, simge?, alt?, git? }], eylem:html, ikincil:html }
     `halka:true`: hedef biliniyor ama bugün kayıt yok — boş halka (iz) çizilir.
     `git`: karo o ekrana götüren düğme olur (data-act="go"). */
  function kapakHtml(o){
    o = o || {};
    const sayi = x => {
      const yok = x.deger == null || x.deger === '';
      const kes = yok ? 'veri_yok' : (x.kesinlik || 'computed');
      const oran = !yok && x.oran != null && isFinite(Number(x.oran)) ? Number(x.oran) : (x.halka ? 0 : null);
      const deger = '<span class="kapak__deger">' + (yok ? '—' : kac(x.deger) + (x.birim ? '<small>' + kac(x.birim) + '</small>' : '')) + '</span>';
      const etiket = x.git ? 'button' : 'div';
      return '<' + etiket + (x.git ? ' type="button" data-act="go" data-route="' + kac(x.git) + '" aria-label="' + kac(x.ad + ': ' + (yok ? 'veri yok' : x.deger + (x.birim ? ' ' + x.birim : ''))) + '"' : '')
        + ' class="kapak__sayi' + (oran != null ? ' has-halka' : '') + (oran != null && oran >= 1 ? ' is-tamam' : '') + (x.git ? ' is-git' : '') + '" data-kesinlik="' + kac(kes) + '" data-simge="' + simgeOf(x) + '">'
        + '<div class="kapak__karo-ust">' + svgS(simgeOf(x), 'kapak__simge')
        + '<span class="kapak__ad">' + kac(x.ad) + '<i title="' + kac(KESINLIK[kes] || kes) + '">' + kac(KESINLIK[kes] || '') + '</i></span></div>'
        + '<div class="kapak__karo-orta">' + (oran != null ? halka(oran) : '') + deger + '</div>'
        + (x.alt ? '<span class="kapak__alt">' + kac(x.alt) + '</span>' : '')
        + sutunlar(x.seri)
        + '</' + etiket + '>';
    };
    const sayilar = (o.sayilar || []).slice(0, 4);
    return '<section class="kapak kapak--' + kac(o.modul || '') + '" aria-label="Bugün">'
      + '<div class="kapak__ic">'
      + (o.selam ? '<p class="kapak__selam">' + kac(o.selam) + '</p>' : '')
      + '<h1 class="kapak__cumle hero__title" tabindex="-1">' + kac(o.cumle || 'Bugün') + '</h1>'
      + (sayilar.length ? '<div class="kapak__sayilar" data-adet="' + sayilar.length + '">' + sayilar.map(sayi).join('') + '</div>' : '')
      + (o.eylem || o.ikincil ? '<div class="kapak__eylem">' + (o.eylem || '') + (o.ikincil || '') + '</div>' : '')
      + '</div>'
      + '<button type="button" class="kapak__asagi" data-kapak-asagi aria-label="Günün ayrıntısına in">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
      + '</section>';
  }

  /* ------------------------------------------------------------ ayar paneli */

  function ayarHtml(modul){
    const a = ayar();
    const sec_ = (ad, deger, secenek) => '<div class="seg seg--block karsilama-ayar__seg" role="group" aria-label="' + kac(ad) + '">'
      + secenek.map(([v, y]) => '<button type="button" class="' + (v === deger ? 'is-on' : '') + '" data-karsilama="' + kac(ad) + '" data-deger="' + kac(v) + '"'
        + ' aria-pressed="' + (v === deger ? 'true' : 'false') + '">' + kac(y) + '</button>').join('') + '</div>';
    return '<div class="karsilama-ayar" data-karsilama-ayar="' + kac(modul || '') + '">'
      + ('<label class="field"><span>' + yz('ortak.karsilama.karsilama-dili') + '</span><select class="input" data-karsilama-alan="dil">')
      + DILLER.map(d => '<option value="' + d.id + '"' + (d.id === a.dil ? ' selected' : '') + '>' + kac(d.ad) + '</option>').join('') + '</select></label>'
      + ('<div class="field"><span>' + yz('ortak.karsilama.selam') + '</span>') + sec_('selam', a.selam, [['karisik', yz('ortak.karsilama.turlu-turlu')], ['kendi', yz('ortak.karsilama.kendi-selamlarim')]]) + '</div>'
      + ('<label class="field"><span>' + yz('ortak.karsilama.kendi-selamlarin') + ' <small>' + yz('ortak.karsilama.her-satira-bir-tane') + '</small></span><textarea class="input" rows="3" data-karsilama-alan="kendi" placeholder="Selam&#10;Hadi bakalım">')
      + kac(a.kendi.join('\n')) + '</textarea></label>'
      + ('<div class="field"><span>' + yz('ortak.karsilama.altindaki-not') + '</span>') + sec_('not', a.not, [['sistem', yz('ortak.karsilama.sistemin-notu')], ['kendi', yz('ortak.karsilama.kendi-notlarim')], ['ikisi', 'İkisi'], ['kapali', 'Kapalı']]) + '</div>'
      + (modul ? ('<label class="field"><span>' + yz('ortak.karsilama.bu-bolum-icin-kendi-notlarin') + ' <small>' + yz('ortak.karsilama.her-satira-bir-tane') + '</small></span><textarea class="input" rows="3" data-karsilama-alan="notlar" placeholder="Matematiği ihmal etme">')
        + kac((a.notlar[modul] || []).join('\n')) + '</textarea></label>' : '')
      + '<p class="karsilama-ayar__ornek" aria-live="polite"><em>' + kac(selam({ ayar:a, modul:modul || 'ays', simdi:new Date(), tohum:1 })) + '</em></p>'
      + '</div>';
  }
  function ayarDegisti(kok){
    const k = kok && kok.closest ? kok.closest('[data-karsilama-ayar]') : null;
    if(!k) return null;
    const modul = k.getAttribute('data-karsilama-ayar');
    const a = ayar();
    const dil = k.querySelector('[data-karsilama-alan="dil"]'), kendi = k.querySelector('[data-karsilama-alan="kendi"]'),
      notlar = k.querySelector('[data-karsilama-alan="notlar"]');
    if(dil) a.dil = dil.value;
    if(kendi) a.kendi = kendi.value.split('\n');
    if(notlar && modul) a.notlar[modul] = notlar.value.split('\n');
    const yeni = ayarYaz(a);
    const ornek = k.querySelector('.karsilama-ayar__ornek em');
    if(ornek) ornek.textContent = selam({ ayar:yeni, modul:modul || 'ays', simdi:new Date() });
    return yeni;
  }

  if(typeof document !== 'undefined'){
    /* Olaylar belge düzeyinde (animasyon seçicisi gibi): modülün data-act
       işleyicisine düşmez. */
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const b = t.closest('[data-karsilama]');
      if(b){
        e.preventDefault();
        const a = ayar();
        a[b.getAttribute('data-karsilama')] = b.getAttribute('data-deger');
        ayarYaz(a);
        const seg = b.parentElement;
        Array.from(seg.children).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        ayarDegisti(b);
        return;
      }
      if(t.closest('[data-kapak-asagi]')){
        e.preventDefault();
        const hedef = document.querySelector('.site__body .sayfa') || document.getElementById('main');
        if(hedef) hedef.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    });
    document.addEventListener('change', e => { if(e.target && e.target.closest && e.target.closest('[data-karsilama-alan]')) ayarDegisti(e.target); });
  }

  return { AYAR, NOT, DILLER, HAVUZ, HATIRA, EN_COK, EN_UZUN, vakit, gunTuru, havuz, selam, not, notYaz, ayarOku, ayar, ayarYaz,
    acilis, perdeyeYaz, kapakHtml, ayarHtml, ayarDegisti, bugunISO, _sifirla:() => { bu = null; } };
})();
