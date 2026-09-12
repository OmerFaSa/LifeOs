/* Referans tablolari: esikler, hedefler, protokoller, kontrol listeleri.
   Kaynak: "Hemsirelik Hedefi — 9 Aylik Kocluk Plani" ve "YKS Kocluk Uygulamasi" belgeleri. */

window.R = window.R || {};

/* ---------- 1. Hedef mimarisi ---------- */
R.TARGET_TIERS = [
  { key:'main',      name:'Ana hedef',       rank:'80.000 ve daha iyi',  tyt:'75–80+', ayt:'35–40+', tytNum:77, aytNum:37,
    note:"Çukurova'nın 2026 sırası 84.285'e tampon bırakır" },
  { key:'realistic', name:'Gerçekçi hedef',  rank:'85.000–100.000',      tyt:'65–75',  ayt:'30–38',  tytNum:70, aytNum:34,
    note:'Popüler devlet hemşirelik havuzu' },
  { key:'safety',    name:'Teminat hedefi',  rank:'125.000–150.000',     tyt:'55–65',  ayt:'25–32',  tytNum:60, aytNum:28,
    note:'Daha geniş devlet havuzu; şehir esnekliği gerekir' },
];

/* Onerilen final test dagilimi — garanti degil, kocluk kontrol bandi (bolum 1.2) */
/* testKey, deneme sablonlarindaki test adiyla birebir eslesir. */
R.TEST_BANDS = [
  { test:'TYT Türkçe',           testKey:'Türkçe',          low:27, high:33, exam:'TYT' },
  { test:'TYT Temel Matematik',  testKey:'Temel Matematik', low:22, high:30, exam:'TYT' },
  { test:'TYT Fen',              testKey:'Fen Bilimleri',   low:8,  high:14, exam:'TYT' },
  { test:'TYT Sosyal (destek)',  testKey:'Sosyal Bilimler', low:10, high:14, exam:'TYT' },
  { test:'AYT Matematik',        testKey:'Matematik',       low:12, high:20, exam:'AYT' },
  { test:'AYT Fizik',            testKey:'Fizik',           low:4,  high:8,  exam:'AYT' },
  { test:'AYT Kimya',            testKey:'Kimya',           low:5,  high:8,  exam:'AYT' },
  { test:'AYT Biyoloji',         testKey:'Biyoloji',        low:8,  high:11, exam:'AYT' },
];

/* 2024 yerlesen son aday netleri — dengeli profilin kaniti (bolum 1.2) */
R.PLACEMENT_PROFILES = [
  { uni:'Çukurova 2024', rows:[['TYT Türkçe','28,75'],['TYT Matematik','20,75'],['TYT Fen','6,75'],['AYT Matematik','17,50'],['AYT Fizik','9,00'],['AYT Kimya','3,50'],['AYT Biyoloji','8,25']] },
  { uni:'Mersin 2024',   rows:[['AYT Matematik','8,75'],['TYT Fen','13,50'],['AYT Biyoloji','9,50']], note:'Aynı bölüme farklı profille de yerleşilebiliyor: tek derse bağımlı olmayan denge önemlidir.' },
];

/* 2026 referans siralari — tercih stratejisi icin (2027 sonucu degildir) */
R.RANK_REFS = [
  { uni:'Çukurova Üniversitesi', rank:84285, quota:120 },
  { uni:'Mersin Üniversitesi',   rank:91586 },
  { uni:'Gaziantep Üniversitesi',rank:93138 },
  { uni:'Geniş devlet havuzu',   rank:'125.000–155.000' },
];

R.OBP = { multiplier:5, coefFirst:0.12, coefRepeat:0.06, min:250, max:500 };

/* ---------- 3. Aylik net gelisim egrisi ve karar kapilari ---------- */
R.MONTH_GATES = {
  'Eylül':   { order:1,  tyt:[20,35], tytSafe:[30,38], ayt:[0,10],  aytSafe:null,    note:'Tanı ayı: sistem kurulmadıysa kaynak değil rutin düzeltilir.' },
  'Ekim':    { order:2,  tyt:[30,40], tytSafe:[38,43], ayt:[0,10],  aytSafe:[5,10],  note:"Matematik neti 8'in altındaysa 21 günlük temel işlem kampı açılır." },
  'Kasım':   { order:3,  tyt:[35,45], tytSafe:[43,48], ayt:[3,12],  aytSafe:[8,14],  note:"TYT 35'in altındaysa 14 gün Türkçe + Matematik ağırlığına geçilir." },
  'Aralık':  { order:4,  tyt:[45,55], tytSafe:[50,58], ayt:[8,18],  aytSafe:[14,20], note:"AYT köprüsü açılmadıysa Ocak'ta haftada 4 AYT bloğu eklenir." },
  'Ocak':    { order:5,  tyt:[50,60], tytSafe:[58,63], ayt:[18,25], aytSafe:[22,27], note:"AYT 18'in altındaysa TYT sosyal/fen hacmi geçici azaltılır." },
  'Şubat':   { order:6,  tyt:[55,65], tytSafe:[62,68], ayt:[20,28], aytSafe:[25,30], note:"AYT konu kapanışı %55'in altındaysa yeni kaynak açılmaz." },
  'Mart':    { order:7,  tyt:[60,70], tytSafe:[68,73], ayt:[25,32], aytSafe:[30,34], note:"AYT Matematik 10'un altındaysa minimum Fen + TYT tampon rotasına geçilir." },
  'Nisan':   { order:8,  tyt:[65,75], tytSafe:[72,78], ayt:[30,35], aytSafe:[33,38], note:'Son üç büyük açık dışında yeni konuya girilmez.' },
  'Mayıs':   { order:9,  tyt:[65,80], tytSafe:[75,82], ayt:[30,40], aytSafe:[36,42], note:'Medyan değil taban skor düşüyorsa hacim azaltılır.' },
  'Haziran': { order:10, tyt:[65,80], tytSafe:[75,82], ayt:[30,40], aytSafe:[36,42], note:'Yeni konu yok; istikrar ve uyku korunur.' },
};

R.GATE_ALGORITHM = [
  'Aynı yayın / zorluk ailesindeki son 3–4 denemenin medyanı alınır.',
  'Hedefin altında kalan test ve baskın hata etiketi belirlenir.',
  'Sorun konu eksiğiyse iki 70 dakikalık öğretim + taramaya; işlemse üç gün 20 benzer soruya; süre ise iki süreli branş setine çevrilir.',
  'Bir sonraki kapıya kadar yalnız bir ana müdahale test edilir.',
  'İki kapı boyunca sonuç yoksa dış destek / öğretmen değerlendirmesi alınır; sürekli kaynak değişimi yapılmaz.',
];

/* ---------- 2.2 KPI panosu ---------- */
R.KPI_DEFS = [
  { key:'planCompletion', name:'Plan tamamlama', formula:'Tamamlanan blok / planlanan blok', target:'≥ %85',
    action:'%85 altındaysa kapasite veya çevresel engel incelenir.' },
  { key:'questionRate', name:'Soru gerçekleşme', formula:'Çözülen yeni soru / hedef', target:'≥ %90',
    action:'Hedef artışı yalnız iki hafta üst üste %90+ ise yapılır.' },
  { key:'topicClosure', name:'Konu kapanış', formula:'Kapanan konu / planlanan konu', target:'İki ölçüm',
    action:'"Kapalı" = konu testi ≥%75 ve 7 gün sonraki test ≥%70.' },
  { key:'netTrend', name:'Net trendi', formula:'Son 3 deneme medyanı − önceki 3 medyan', target:'Yükselen',
    action:'Tek denemeyle karar verilmez; medyan trendi kullanılır.' },
  { key:'examBase', name:'Deneme tabanı', formula:"Son 4 denemenin en düşüğü", target:'Yükselen',
    action:'Taban düşüyorsa yük azaltılır — kötü gün dayanıklılığı göstergesidir.' },
  { key:'errorMix', name:'Hata tipi dağılımı', formula:'Etiket adedi / toplam hata', target:'K payı düşen',
    action:'En büyük iki etiket gelecek haftaya 2 ek blok alır.' },
  { key:'timeDrift', name:'Süre sapması', formula:'Gerçek süre − hedef süre', target:'TYT < 5 dk',
    action:'Net artarken süre bozuluyorsa süreli set çalışılır.' },
  { key:'cardDebt', name:'Tekrar borcu', formula:'Gecikmiş kart / due kart', target:'≤ %10',
    action:'%10 üstünde yeni kart üretimi azaltılır.' },
];

/* ---------- 6.1 Yillik deneme hacmi ---------- */
R.EXAM_VOLUME = [
  { period:'Eylül – Kasım',  weeks:[1,11],  tyt:[4,6],   ayt:[1,1],   branch:[18,24], aytNote:'1 tanı' },
  { period:'Aralık – Ocak',  weeks:[12,20], tyt:[6,8],   ayt:[3,5],   branch:[18,24] },
  { period:'Şubat – Mart',   weeks:[21,29], tyt:[10,12], ayt:[8,10],  branch:[24,30] },
  { period:'Nisan – Mayıs',  weeks:[30,38], tyt:[18,22], ayt:[16,20], branch:[24,30] },
  { period:'Haziran',        weeks:[39,40], tyt:[4,6],   ayt:[4,6],   branch:null, branchNote:'Gerektikçe' },
];

/* ---------- 6.2 Yayin zorluk merdiveni ---------- */
R.PUBLISHER_LADDER = [
  { level:'Başlangıç / orta', detail:'345, Bilgi Sarmal, Hız ve Renk — anlaşılır dil ve dengeli seçki.' },
  { level:'Orta / üst',       detail:'Endemik, Orijinal, 3D — yalnız temel oturduktan sonra.' },
  { level:'Resmî dil',        detail:"ÖSYM'nin geçmiş TYT/AYT soruları — konu öğrenmek için erken tüketilmez, Mart–Mayıs arasında setlenir." },
];
R.PUBLISHER_RULES = [
  'Aynı hafta üç farklı zorluk seviyesi karıştırılmaz.',
  'Trend için en az üç deneme aynı yayın ailesinden gelmelidir.',
  'Güncel baskı, cevap anahtarı duyuruları ve müfredat uyumu satın almadan önce kontrol edilir.',
];

/* ---------- 6.3 Deneme analizi protokolu ---------- */
R.ANALYSIS_PROTOCOL = [
  { key:'score',   title:'Skor', time:'5 dk',      detail:'Doğru, yanlış, boş, net ve test süresi kaydedilir.' },
  { key:'resolve', title:'Yeniden çözüm', time:'20–30 dk', detail:'Cevap anahtarı açılmadan yanlış ve boşlar tekrar denenir.' },
  { key:'tag',     title:'Etiket', time:'30–45 dk', detail:'K konu, İ işlem, Y yorum/kök, S süre, D dikkat olarak ayrılır.' },
  { key:'root',    title:'Kök neden', time:'—',    detail:'"Dikkatsizlik" son açıklama değildir; yanlış işaretleme, satır kayması, birim atlama gibi somut davranış yazılır.' },
  { key:'recipe',  title:'Tamir reçetesi', time:'—', detail:'K → 20 dk konu + 20 soru; İ → üç gün 10 benzer; Y → kök altını çizme + 10 soru; S → süreli 20’li set.' },
  { key:'repeat',  title:'Tekrar', time:'—',       detail:'Yanlış soru 1 gün ve 7 gün sonra çözümsüz yeniden yapılır.' },
  { key:'plan',    title:'Plan etkisi', time:'—',  detail:'En yüksek frekanslı iki etiket gelecek hafta toplam iki blok alır.' },
];

R.ERROR_TAGS = {
  K:{ key:'K', name:'Konu eksiği',        recipe:'20 dk konu anlatımı + 20 soru',        color:'var(--c-k)' },
  'İ':{ key:'İ', name:'İşlem hatası',     recipe:'3 gün boyunca 10 benzer soru',          color:'var(--c-i)' },
  Y:{ key:'Y', name:'Yorum / kök okuma',  recipe:'Kökü işaretle + 10 soru',               color:'var(--c-y)' },
  S:{ key:'S', name:'Süre',               recipe:'Süreli 20 soruluk branş seti',          color:'var(--c-s)' },
  D:{ key:'D', name:'Dikkat',             recipe:'Somut tetikleyici belirle + kontrol rutini', color:'var(--c-d)' },
};

/* ---------- 6.4 Yanlis defteri tasarimi ---------- */
R.NOTEBOOK_FIELDS = [
  ['Kimlik', 'Tarih, yayın, deneme, soru no, ders – konu'],
  ['İlk durum', 'Yanlış / boş / yavaş ve harcanan süre'],
  ['Etiket', 'K / İ / Y / S / D'],
  ['Kök neden', 'Tek somut cümle'],
  ['Doğru ilke', 'En fazla 2–3 satır; tam çözüm kopyalanmaz'],
  ['Benzer soru', 'Kaynak ve test no'],
  ['Tekrar tarihleri', '+1 gün, +3 gün, +1 hafta, +1 ay'],
  ['Kapanış', 'Çözümsüz doğru ve süre uygun mu?'],
];

/* ---------- 7.1 Araliklı tekrar protokolu ---------- */
R.SRS_INTERVALS = [1, 3, 7, 30];
R.SRS_PROTOCOL = [
  { day:'0. gün',   detail:'Konu biter; kitap kapanır, boş kâğıda 5 dakika geri çağırma yapılır.' },
  { day:'+1 gün',   detail:'8–12 kart + 5 kısa soru.' },
  { day:'+3 gün',   detail:'Karışık 10–15 soru; yanlış kartlar yeniden başlar.' },
  { day:'+1 hafta', detail:'Süreli mini test ve boş sayfa özeti.' },
  { day:'+1 ay',    detail:'Branş denemesi veya 20 soruluk karma test.' },
];

/* ---------- 7.2–7.4 Rutin, uyku, kaygi ---------- */
R.ROUTINES = {
  minimumDay: { minutes:45, paragraphs:15, note:'Motivasyon çalışmanın önkoşulu değil, düzenin yan ürünüdür. Kötü günün standardı: 45 dakika + 15 paragraf + due kartlar.' },
  motivation:[
    'Kötü deneme sonrası 24 saat içinde plan değiştirilmez; analiz tamamlanır ve üç deneme trendi beklenir.',
    'Haftalık başarı "net" kadar süreç davranışıyla ölçülür: oturum sayısı, analiz tamamlama, uyku ve kart borcu.',
    'Ayda bir yarım gün tamamen ders dışı etkinlik planlanır; bu kaçış değil sürdürülebilirlik aracıdır.',
    'Üç hafta süren isteksizlik, uyku bozulması veya işlev kaybı varsa rehber öğretmen / psikolojik danışman desteği istenir.',
  ],
  sleep:{ targetLow:7, targetHigh:8, items:[
    'Hedef 7–8 saat düzenli uyku; her gün benzer yatış ve kalkış saati.',
    'Son dört haftada kalkış saati sınav sabahına göre kademeli ayarlanır.',
    'Kafein, denemelerde sınav gününde kullanılacak miktar ve saatte denenir; sınav sabahı yeni rutin yoktur.',
    'Pazar tam dinlenmeye yakındır; Haziranda gece çalışmasıyla borç kapatılmaz.',
  ]},
  anxiety:[
    'Aralıktan itibaren her tam denemeden önce 2 dakika yavaş nefes ve standart başlangıç cümlesi uygulanır.',
    'Nisan–Mayıs çift oturum provaları belirsizliği azaltır.',
    '"Ya kazanamazsam?" düşüncesi kontrol edilebilir eyleme çevrilir: "Bu denemede matematikte ilk tur 55 dakika."',
    'Kaygı panik atağa, kalıcı uykusuzluğa veya işlev kaybına dönüşürse profesyonel yardım alınır; koçluk klinik tedavi değildir.',
  ],
};

/* ---------- 8. Telafi protokolleri ---------- */
R.RECOVERY_PROTOCOLS = [
  {
    id:'two-weeks-behind',
    title:'İki hafta geride kalındıysa',
    trigger:'İki hafta üst üste plan tamamlama %80 altında',
    durationDays:14,
    steps:[
      'Kaçan konular olduğu gibi taşınmaz; A (önkoşul / yüksek getiri), B (orta), C (düşük öncelik) etiketi verilir.',
      'İki haftalık "reset"te yalnız A konuları, paragraf, matematik rutini ve deneme analizi korunur.',
      'Soru hedefi %20 azaltılır; yeni kaynak ve zor test dondurulur.',
      'TYT Sosyal ve düşük getirili ayrıntı blokları geçici çıkarılır.',
      '14 gün sonunda plan tamamlama %85’e döndüyse B konuları sırayla eklenir.',
    ],
  },
  {
    id:'ayt-late',
    title:'AYT Şubat’ta başlayamamışsa',
    trigger:'Şubat sonunda AYT medyanı 20 netin altında',
    durationDays:60,
    steps:[
      'AYT Matematikte fonksiyon → polinom/denklem → trigonometri/logaritma → limit-türev rotası; integral yalnız önkoşullar yeterliyse.',
      'AYT Biyolojide hücre bölünmesi → kalıtım → fizyoloji → enerji; Kimyada mol → denge → asit-baz → organik.',
      'Fizikte mekanik temel → elektrik → indüksiyon/BHM/dalga; minimum 4–6 net rotası.',
      'Haftanın 4 günü AYT, 2 günü TYT + deneme; TYT yalnız paragraf, problem, branş ve tam denemeyle korunur.',
      'Nisan sonunda tam AYT 20 net altındaysa hedef sıra teminat bandıyla birlikte yeniden değerlendirilir; sınav bırakılmaz.',
    ],
  },
  {
    id:'math-weak',
    title:'Matematik çok zayıfsa',
    trigger:'Ekim sonunda TYT Matematik < 8 net, veya Mart sonunda AYT Matematik < 10 net',
    durationDays:21,
    steps:[
      'Ekim sonunda TYT Matematik 8 altındaysa: dört işlem – kesir – rasyonel – üslü – köklü için 21 günlük temel kamp; geometri haftada iki kısa blok.',
      'Mart sonunda AYT Matematik 10 altındaysa: 12–15 net hedefli seçici rota — fonksiyon, polinom, 2. derece, logaritma, dizi, temel trigonometri, analitik ve temel limit/türev.',
      'TYT Türkçe 30+, TYT Fen 12+, AYT Biyoloji 9+, Kimya 6+ tamponu geliştirilir; Fizik sıfırlanmaz.',
      '2024 Mersin örneğinde AYT Matematik 8,75 netle yerleşme görülmüştür; bu bir mümkünlük kanıtıdır, 2027 garantisi değildir.',
    ],
  },
  {
    id:'flat-nets',
    title:'Netler dört hafta sabitse',
    trigger:'Son 4 denemenin medyanı değişmiyor',
    durationDays:14,
    steps:[
      'Kaynak değişimi yasaklanır; son 4 denemenin hata paretosu çıkarılır.',
      'Konu hatası baskınsa öğretim; işlem baskınsa benzer soru; süre baskınsa branş seti artırılır.',
      'Bir hafta hacim %20 düşürülüp uyku ve analiz kalitesi düzeltilir.',
      'Sonraki iki haftada tek müdahale denenir; sonuç yoksa öğretmenle soru çözüm gözlemi yapılır.',
    ],
  },
  {
    id:'illness-break',
    title:'Hastalık, aile yükü veya bir haftalık kopuş',
    trigger:'Ardışık 3+ gün kayıt yok',
    durationDays:7,
    steps:[
      'İlk dönüş günü tam deneme yapılmaz; kart borcu temizlenir ve iki kolay-orta karma set çözülür.',
      'Üç gün %60 kapasite, sonra normal hacme dönüş uygulanır.',
      'Kaçırılan denemeler telafi edilmez; takvim ileriye doğru sürer.',
      'Sağlık sorunu devam ediyorsa çalışma hedefi sağlık planına göre azaltılır.',
    ],
  },
];

/* ---------- 9. Resmi takvim ---------- */
R.OFFICIAL_CALENDAR = [
  { when:'Kasım 2026',            status:'Beklenen duyuru', what:'ÖSYM takvimi kontrol edilir; TYT/AYT tarihi, başvuru ve sonuç günü plana yazılır.' },
  { when:'Ocak 2027',             status:'Hazırlık',        what:'ÖSYM AİS giriş bilgileri, geçerli fotoğraf/kimlik ve iletişim bilgileri kontrol edilir.' },
  { when:'Şubat – Mart 2027',     status:'Tahmin',          what:'Başvuru ilk hafta tamamlanır; TYT ve AYT oturumları ile ücret/onay ekranı doğrulanır. 2026 referansı: 6 Şubat–2 Mart.' },
  { when:'Geç başvuru',           status:'Yalnız kaçırılırsa', what:"Resmî geç başvuru günü ve ücreti ÖSYM'den kontrol edilir; normal plan gibi görülmez." },
  { when:'Mayıs sonu – Haziran',  status:'Beklenen',        what:'Sınava giriş belgesi yayımlanınca bina, rota ve ulaşım prova edilir.' },
  { when:'19–20 Haziran 2027',    status:'Tahmin',          what:'TYT Cumartesi, AYT Pazar varsayımı; kesin tarih ÖSYM’den alınır. 2026 referansı: 20–21 Haziran.' },
  { when:'Temmuz 2027',           status:'Tahmin',          what:'Sonuç belgesi indirilir; SAY başarı sırası, puan ve OBP kontrol edilir.' },
  { when:'Temmuz sonu – Ağustos', status:'Tahmin',          what:'2027 tercih kılavuzu ve YÖK Atlas güncellenir; 24 tercih son gün beklenmeden onaylanır.' },
  { when:'Ağustos – Eylül',       status:'Tahmin',          what:'Yerleştirme / kayıt; yerleşilemezse ek yerleştirme kılavuzu izlenir.' },
];
R.CALENDAR_RULE = 'Sosyal medya takvimi resmî kabul edilmez. İşlem yalnız ÖSYM duyurusu, AİS ekranı ve yayımlanan kılavuz üçlüsüyle tamamlanır. 2026 kuralları ve tarihleri 2027 için otomatik kopyalanmaz.';

/* ---------- 10. Sinav haftasi ve sinav gunu ---------- */
R.EXAM_WEEK_OPS = [
  'Pazartesi kısa TYT; Salı kısa AYT; Çarşamba sonrası tam deneme yok.',
  'Yeni konu, yeni yayın, yeni uyku ilacı/takviye ve denenmemiş besin yok.',
  'Kimlik, sınava giriş belgesi ve yasaklı eşya kuralları güncel ÖSYM belgesinden okunur.',
  'Sınav binasına ulaşım bir hafta önce aynı saatte prova edilir; Adana sıcaklığı ve ulaşım gecikmesi için tampon bırakılır.',
  'TYT akşamı soru tartışması yapılmaz; AYT için kısa kart turu ve erken uyku uygulanır.',
  'Test sırası Mayıs provalarında en yüksek neti ve en düşük süre oynaklığını veren düzendir; sınav sabahı değiştirilmez.',
];

/* ---------- 11. Tercih mimarisi ---------- */
R.PREFERENCE_TIERS = [
  { key:'aggressive', range:[1,8],   name:'Agresif',  detail:'Aday sırasından yaklaşık %10–15 daha iyi kapanmış, gerçekten istenen programlar.' },
  { key:'realistic',  range:[9,16],  name:'Gerçekçi', detail:'Aday sırasıyla örtüşen Çukurova, Mersin ve benzeri güncel seçenekler.' },
  { key:'safe',       range:[17,24], name:'Güvenli',  detail:'Aday sırasından belirgin geride kapanmış, yaşamaya ve okumaya razı olunan programlar.' },
];
R.PREFERENCE_CHECKS = ['Eğitim dili','Şehir / yaşam maliyeti','Yurt ve ulaşım','Akreditasyon','Özel koşul','Kontenjan değişimi','Önceki üç yıl sıra eğilimi'];

/* ---------- 12. Kontrol listeleri ---------- */
R.CHECKLISTS = {
  monday:{ label:'Her pazartesi', items:[
    'Üç ana konu ve soru hedefi yazıldı.',
    'Deneme günü ve yayın belli.',
    'Due kartlar takvime dağıtıldı.',
    'Geçen haftanın en büyük iki hata etiketi plan aldı.',
  ]},
  saturday:{ label:'Her cumartesi', items:[
    'Deneme gerçek süreyle çözüldü.',
    'Doğru – yanlış – boş – net ve süre kaydedildi.',
    'Yanlışlar cevaba bakmadan yeniden denendi.',
    'Tamir reçeteleri yazıldı.',
  ]},
  sunday:{ label:'Her pazar', items:[
    'Plan tamamlama ve soru gerçekleşme oranı hesaplandı.',
    'Son üç deneme medyanı ve son dört tabanı görüldü.',
    'Kart borcu ve uyku düzeni kontrol edildi.',
    'Yeni haftaya yalnız en yüksek etkili iki eksik taşındı.',
  ]},
  monthly:{ label:'Aylık karar kapısında', items:[
    'Net matrisi "gözlenen / güvenli" bantla karşılaştırıldı.',
    'Konu kapanış yüzdesi ve hata dağılımı çıkarıldı.',
    'Tek bir ana süreç müdahalesi seçildi.',
    '2027 resmî takvim / kılavuz değişikliği kontrol edildi.',
  ]},
};

/* ---------- 2.3 Hesap verebilirlik ---------- */
R.ACCOUNTABILITY = [
  'Pazartesi hedef sayfası aday ve hesap verebilirlik partneri tarafından görülür.',
  'Cumartesi ekran görüntüsü değil; optik sonuç, süre ve analiz formu teslim edilir.',
  'Pazar günü "planlandı / yapıldı / neden sapıldı / düzeltme" dört sütunu doldurulur.',
  'İki hafta üst üste %80 altı plan tamamlama "irade sorunu" diye etiketlenmez; hedef hacmi %15 azaltılır, süreç engeli kaldırılır.',
  'Raporlama dürüstlüğü esastır: çözüme bakılarak yapılan soru "doğru" değil, "öğrenme sorusu" sayılır.',
  'Ödül mekanizması nete değil davranışa bağlanır: altı gün düzen, analizlerin zamanında bitmesi, uyku saatine uyum.',
];

/* ---------- Deneme sablonlari ---------- */
R.EXAM_TEMPLATES = [
  { id:'tyt-full',  name:'Tam TYT',        family:'TYT', kind:'full',   duration:165,
    tests:[{name:'Türkçe',q:40},{name:'Sosyal Bilimler',q:20},{name:'Temel Matematik',q:40},{name:'Fen Bilimleri',q:20}] },
  { id:'ayt-full',  name:'Tam AYT (SAY)',  family:'AYT', kind:'full',   duration:180,
    tests:[{name:'Matematik',q:40},{name:'Fizik',q:14},{name:'Kimya',q:13},{name:'Biyoloji',q:13}] },
  { id:'tyt-cut',   name:'TYT kesit (Türkçe + Matematik)', family:'TYT', kind:'partial', duration:80,
    tests:[{name:'Türkçe',q:40},{name:'Temel Matematik',q:40}] },
  { id:'br-turkce', name:'Branş — Türkçe',        family:'TYT', kind:'branch', duration:40, tests:[{name:'Türkçe',q:40}] },
  { id:'br-tytmat', name:'Branş — TYT Matematik', family:'TYT', kind:'branch', duration:50, tests:[{name:'Temel Matematik',q:40}] },
  { id:'br-tytfen', name:'Branş — TYT Fen',       family:'TYT', kind:'branch', duration:25, tests:[{name:'Fen Bilimleri',q:20}] },
  { id:'br-aytmat', name:'Branş — AYT Matematik', family:'AYT', kind:'branch', duration:75, tests:[{name:'Matematik',q:40}] },
  { id:'br-fizik',  name:'Branş — AYT Fizik',     family:'AYT', kind:'branch', duration:30, tests:[{name:'Fizik',q:14}] },
  { id:'br-kimya',  name:'Branş — AYT Kimya',     family:'AYT', kind:'branch', duration:28, tests:[{name:'Kimya',q:13}] },
  { id:'br-biyo',   name:'Branş — AYT Biyoloji',  family:'AYT', kind:'branch', duration:28, tests:[{name:'Biyoloji',q:13}] },
  { id:'mini',      name:'Mini deneme',           family:'TYT', kind:'mini',   duration:30, tests:[{name:'Mini test',q:20}] },
];

/* Blok atlama nedenleri (urun plani 7.2) */
R.SKIP_REASONS = ['Süre yoktu','Beklenenden zordu','Sağlık / enerji','Kaynak yoktu','Plan gerçekçi değildi','Diğer'];

/* Kesinlik etiketleri (bolum 1) */
/* KAYNAK (provenance) — bir REFERANS TABLOSUNUN nereden geldigi.

   Bu sozluk "sayi ne kadar kesin" sorusunu degil, "bu esik hangi
   belgeye dayaniyor" sorusunu cevaplar: ÖSYM'nin resmi tablosu mu,
   gecen yilin verisi mi, bizim planlama varsayimimiz mi.

   Adi eskiden R.CERTAINTY idi ve bu bir karisiklik uretiyordu: kardes
   uygulamalarda ayni ad OLCUM KESINLIGINI tasir (asagida). Ikisi farkli
   sorulardir ve ayni ekranda yan yana durabilirler — bir sirali tahmini
   hem "2026 referansi" (kaynak) hem "hesaplandi" (kesinlik) olabilir. */
R.PROVENANCE = {
  official:{ label:'Resmî', tone:'info', detail:'ÖSYM / YÖK belgesine dayanır.' },
  ref2026:{ label:'2026 referansı', tone:'muted', detail:'Geçmiş yıl verisidir.' },
  estimate:{ label:'Tahmin', tone:'warn', detail:'2027 için planlama varsayımıdır.' },
  coaching:{ label:'Koçluk hedefi', tone:'ok', detail:'Performans yönetimi önerisidir; yerleşme garantisi değildir.' },
};

/* KESINLIK — bir SAYININ nasil elde edildigi.

   SPI'deki SP.CERTAINTY ile BIREBIR ayni dort etiket. Ayni olmasi
   kasitlidir: HKM katmani uc modulden gelen veriyi bu etikete gore
   denetleyecek ve "veri yok" alani asla 0 olarak yorumlamayacak.

   Son satir en onemlisi. Girilmemis bir alan sifir DEGILDIR:
   girilmemis bos sayisini 0 saymak, kullaniciya vermedigi bir bilgiyi
   geri okutur ve uzerine tavsiye uretir. */
R.CERTAINTY = {
  measured:{ label:'ölçüldü', tone:'ok',
    detail:'Kullanıcının girdiği ya da zamanlayıcının tuttuğu ham veri.' },
  estimated:{ label:'tahmin', tone:'warn',
    detail:'Öznel değerlendirme ya da planlama varsayımı. Düzeltilebilir.' },
  derived:{ label:'hesaplandı', tone:'info',
    detail:'İki ölçülmüş değerden formülle üretildi.' },
  missing:{ label:'veri yok', tone:'muted',
    detail:'Hiç girilmemiş. Sıfır sayılmaz, ortalamaya girmez.' },
};
