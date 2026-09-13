/* Kanit katmani — hangi esik nereden geliyor ve NE SOYLEMEYE YETKILI.

   SPI'de dogan katmanin AYS'ye tasinmis hali. Oradaki cumle burada da
   aynen gecerli:

     "Deterministik olmak, bilimsel olarak dogru olmak anlamina gelmez."

   AYS'nin kural motoru saglamdi ama esiklerin KENDISI nereden geliyordu?
   "Konu testi >=%75 ve yedi gun sonra >=%70 ise konu kapanir" cumlesi
   kodda kesindir. Peki 75 neden 75? 70 neden 70? Yedi gun neden yedi?

   Durust cevap: cogu BU SISTEMIN SECIMIDIR. Bunu gizlemek, bir tasarim
   tercihini pedagojik bir bulgu gibi sunmak olurdu.

   ---------------------------------------------------------------------
   DORT EKSEN (SPI ile ayni, alan farkli)

     source        Bu sayi NEREDEN geliyor? (siralama YOK, sadece tur)
     certainty     Elimizdekine NE KADAR guveniyoruz?
     applicability Bu esik BU adaya ne kadar uyuyor?
     authority     AYS bu kaynaga dayanarak NE YAPABILIR?

   Ilk ucu epistemik iddia, dorduncusu TASARIM POLITIKASIDIR. "Bu
   dogrudur" ile "sistemimiz yalnizca su kosulda bunu eyleme cevirir"
   ayni turden cumleler degildir; sonsuz gerilemeyi kesen sey de budur.

   Ev kurallari (data/rules.js) burada da gecerlidir: hicbir esik
   "sen bu bolume giremezsin" demez. En guclu yetki bile bir ONERI
   uretir, bir yargi degil. */

window.R = window.R || {};

/* ------------------------------------------------------------- eksen 1
   KAYNAK TURU — siralanmaz, yalnizca tanimlar. */
R.EVIDENCE_SOURCES = [
  { id:'exam_authority', label:'Sınav kaynağı',
    note:'Sınavı düzenleyen kurumun ilan ettiği bilgi: tarih, soru sayısı, '
       + 'puan formülü, katsayı.' },
  { id:'research', label:'Öğrenme araştırması',
    note:'Öğrenme bilimi bulgusu: aralıklı tekrar, geri getirme pratiği, '
       + 'harmanlanmış çalışma gibi genel kabul görmüş etkiler.' },
  { id:'personal_data', label:'Kendi verin',
    note:'Adayın kendi ölçümünden hesaplanır: medyan, taban, hata dağılımı. '
       + 'Başkasıyla karşılaştırılmaz.' },
  { id:'system_tuning', label:'Sistem ayarı',
    note:'Bu yazılımın pratik sebeplerle seçtiği sayı. Pedagojik bir bulgu '
       + 'değildir ve öyle sunulmaz.' },
];

/* ------------------------------------------------------------- eksen 2 */
R.EVIDENCE_CERTAINTY = [
  { id:'high',     label:'Yüksek',     note:'Kaynak açık ve tartışmasız.' },
  { id:'moderate', label:'Orta',       note:'Genel kabul var, ayrıntıda değişebilir.' },
  { id:'low',      label:'Düşük',      note:'Dolaylı ya da bağlama çok bağlı.' },
  { id:'unknown',  label:'Bilinmiyor', note:'Kesinlik değerlendirilmemiş.' },
];

/* ------------------------------------------------------------- eksen 3 */
R.EVIDENCE_APPLICABILITY = [
  { id:'direct',   label:'Doğrudan',
    note:'Eşik bu aday ve bu sınav için doğrudan geçerli.' },
  { id:'indirect', label:'Dolaylı',
    note:'Bulgu genel; bu adaya uyarlanırken kayabilir.' },
  { id:'local',    label:'Yerel',
    note:'Eşik kişiye özel; başka adayla karşılaştırılamaz.' },
];

/* ------------------------------------------------------------- eksen 4
   YETKI — BU BIR PEDAGOJIK HIYERARSI DEGILDIR. AYS'nin operasyonel
   yetki politikasidir. */
R.EVIDENCE_AUTHORITY = [
  { id:'steer',         label:'Yönlendirebilir', tone:'ok', mayDirect:true, cap:null,
    note:'Plan ve öncelik değiştirebilir.' },
  { id:'limited_steer', label:'Sınırlı yönlendirir', tone:'ok', mayDirect:true, cap:0.35,
    note:'Öneri üretebilir ama etkisi sınırlıdır.' },
  { id:'inform',        label:'Bilgilendirir', tone:'info', mayDirect:false, cap:0.20,
    note:'Gözlem bildirir; plan değiştirmez.' },
  { id:'observe_only',  label:'Yalnız izler', tone:'warn', mayDirect:false, cap:0.20,
    note:'Yalnızca izlenir; hiçbir karar yalnız buna dayandırılmaz.' },
];

R.EVIDENCE_POLICY = {
  version:1,
  changedAt:'2026-09-13',
  title:'AYS operasyonel yetki politikası',
  disclaimer:'Bu tablo evrensel bir pedagojik hiyerarşi DEĞİLDİR. '
    + 'AYS\'nin hangi kaynak türüne eyleme dönük ne kadar söz hakkı '
    + 'tanıdığını söyler. Bilimsel bir iddia değil, bir yazılım kararıdır.',
  rationale:'Sınavın kendi kuralları (tarih, puan formülü) tartışılmaz; '
    + 'adayın kendi ölçümü onun için en geçerli veridir; öğrenme araştırması '
    + 'genel bir yön verir ama kişiye uyarlanırken kayar; sistemin kendi '
    + 'seçtiği sayılar ise yalnızca bir başlangıç noktasıdır ve öyle '
    + 'etiketlenir.',
  history:[
    { version:1, at:'2026-09-13',
      note:'SPİ\'de doğan dört eksenli katman AYS\'ye taşındı. Sebep: '
         + 'AYS\'nin eşiklerinin çoğu (kapanış kuralı, ay kapıları, plan '
         + 'tamamlama hedefi) sistemin kendi seçimiydi ve hiçbiri bunu '
         + 'söylemiyordu.' },
  ],
  defaults:{
    exam_authority:'steer',
    personal_data:'steer',
    research:'limited_steer',
    system_tuning:'observe_only',
  },
};

/* Kayitlar.

   `rule` esigin kod icindeki adi; `cite` kaynagin ADIDIR (baglanti degil,
   baglanti curur). `population` esigin KIME ait oldugunu soyler. */
R.EVIDENCE = [

  /* -------------------------------------------------- sinavin kendisi */
  { rule:'exam.dates', sourceType:'exam_authority', certainty:'high',
    cite:'Sınav takvimi — sınavı düzenleyen kurumun ilanı',
    population:'bütün adaylar',
    note:'Tarih her yıl ilan edilir ve değişebilir; sistem ilan edileni '
       + 'kullanır, tahmin etmez.' },
  { rule:'exam.netFormula', sourceType:'exam_authority', certainty:'high',
    cite:'Net = doğru − yanlış/4',
    population:'bütün adaylar',
    note:'Sınavın kendi kuralıdır; sistemin yorumu değildir.' },
  { rule:'exam.testCounts', sourceType:'exam_authority', certainty:'high',
    cite:'Test başına soru sayısı ve süre — kurum ilanı',
    population:'bütün adaylar' },

  /* --------------------------------------------- ogrenme arastirmasi */
  { rule:'srs.spacing', sourceType:'research', certainty:'moderate',
    applicability:'indirect',
    cite:'Aralıklı tekrar (spacing effect) — tekrarların araya zaman '
       + 'koyularak yapılmasının, üst üste yapılmasından daha kalıcı '
       + 'olduğu yönündeki yerleşik bulgu',
    population:'genel öğrenen; birey ve konuya göre DEĞİŞİR',
    note:'Etkinin varlığı yerleşiktir; ARALIKLARIN kendisi (1, 3, 7, 16 gün) '
       + 'bu sistemin seçimidir. Bulgu ile ayarı karıştırmamak gerekir.' },
  { rule:'srs.retrieval', sourceType:'research', certainty:'moderate',
    applicability:'indirect',
    cite:'Geri getirme pratiği (testing effect) — hatırlamaya çalışmanın, '
       + 'tekrar okumaktan daha kalıcı olduğu yönündeki yerleşik bulgu',
    population:'genel öğrenen',
    note:'Sistemin kart yerine SORU sormasının dayanağı budur.' },
  { rule:'plan.interleaving', sourceType:'research', certainty:'low',
    applicability:'indirect',
    cite:'Harmanlanmış çalışma (interleaving) — farklı konu tiplerini '
       + 'karıştırmanın transferi artırdığı yönündeki bulgu',
    population:'çalışmaya ve konuya göre DEĞİŞİR',
    note:'Etkisi konuya çok bağlıdır; bu yüzden yalnızca bilgilendirme '
       + 'üretir, plan zorlamaz.' },
  { rule:'sleep.performance', sourceType:'research', certainty:'moderate',
    applicability:'indirect',
    cite:'Uyku yoksunluğunun dikkat ve çalışma belleği üzerindeki olumsuz '
       + 'etkisi — yerleşik bulgu',
    population:'genel; bireysel ihtiyaç DEĞİŞİR',
    note:'Sistem uyku ile net arasındaki ilişkiyi SENİN verinden ölçer; '
       + 'genel bulguyu senin üzerinde varsaymaz.' },

  /* ------------------------------------------------------ kendi verin */
  { rule:'exam.median', sourceType:'personal_data', certainty:'high',
    applicability:'local',
    cite:'Son 3–4 denemenin medyanı — adayın kendi ölçümü',
    population:'yalnızca bu aday',
    note:'Medyan seçilmesi kasıtlıdır: tek kötü deneme ortalamayı bozar, '
       + 'medyanı bozmaz. Aynı yayın ailesinden olmak şarttır — farklı '
       + 'zorluktaki denemelerin medyanı bir şey ölçmez.' },
  { rule:'exam.base', sourceType:'personal_data', certainty:'high',
    applicability:'local',
    cite:'Son 4 denemenin en düşüğü (taban) — adayın kendi ölçümü',
    population:'yalnızca bu aday',
    note:'Taban, kötü gün dayanıklılığını ölçer. Medyan yükselirken taban '
       + 'düşüyorsa istikrar bozuluyor demektir.' },
  { rule:'error.pareto', sourceType:'personal_data', certainty:'moderate',
    applicability:'local',
    cite:'Hata etiketlerinin dağılımı — adayın kendi işaretlemesi',
    population:'yalnızca bu aday',
    note:'Etiketi aday koyar: bu bir ÖLÇÜM değil bir BEYANDIR ve öyle '
       + 'etiketlenir.' },

  /* -------------------------------------------------- sistemin secimi */
  { rule:'closure.first', sourceType:'system_tuning', certainty:'unknown',
    cite:'Bu sistemin seçimi — ilk konu testi eşiği %75',
    population:'—',
    note:'%75 pedagojik bir bulgu DEĞİLDİR. Seçilme sebebi pratiktir: '
       + 'dörtte üçü bilmek konuyu "öğrenilmiş" saymaya yetecek kadar '
       + 'yüksek, ama adayı tek bir testte tıkayacak kadar da yüksek değil. '
       + 'Başka bir sayı da savunulabilirdi ve bu açıkça yazılıdır.' },
  { rule:'closure.second', sourceType:'system_tuning', certainty:'unknown',
    cite:'Bu sistemin seçimi — yedi gün sonraki tekrar testi eşiği %70',
    population:'—',
    note:'İkinci eşiğin daha düşük olması kasıtlıdır: aradan geçen zamanda '
       + 'bir miktar unutma BEKLENİR. Yedi günün kendisi de bir seçimdir; '
       + 'aralıklı tekrar bulgusuna dayanır ama o bulgu "yedi" demez.' },
  { rule:'kpi.planCompletion', sourceType:'system_tuning', certainty:'unknown',
    cite:'Bu sistemin seçimi — plan tamamlama hedefi %85',
    population:'—',
    note:'%85, sürdürülebilirlik için seçilmiş bir sayıdır: %100 hedefi '
       + 'ilk aksayan günde planı çöpe attırır. Bir bulgu değil bir '
       + 'davranış tercihidir.' },
  { rule:'kpi.cardDebt', sourceType:'system_tuning', certainty:'unknown',
    cite:'Bu sistemin seçimi — tekrar borcu üst sınırı %10',
    population:'—',
    note:'Borç eşiği, yeni kart üretimini ne zaman kısacağını belirler. '
       + 'Pedagojik bir sınır değil, bir kuyruk yönetimi kararıdır.' },
  { rule:'month.gates', sourceType:'system_tuning', certainty:'unknown',
    applicability:'indirect',
    cite:'Bu sistemin seçimi — aylık net bantları',
    population:'hedefe ve başlangıç seviyesine göre DEĞİŞİR',
    note:'Bu bantlar bir norm DEĞİLDİR: kimsenin ortalaması değil, bu '
       + 'sistemin kurduğu bir tempo çizgisidir. Bandın altında kalmak '
       + '"geri kaldın" demek değil, "planı gözden geçir" demektir. Bu '
       + 'yüzden yalnızca izlenir, plan zorlamaz.' },
  { rule:'exam.volume', sourceType:'system_tuning', certainty:'unknown',
    applicability:'indirect',
    cite:'Bu sistemin seçimi — dönemlik deneme sayısı aralıkları',
    population:'—',
    note:'Deneme sayısı bir hedef değil bir tavandır: analiz edilmeyen '
       + 'deneme bir ölçüm değil bir yorgunluktur.' },
  { rule:'break.rule', sourceType:'system_tuning', certainty:'low',
    applicability:'indirect',
    cite:'Bu sistemin seçimi — blok ve mola süreleri',
    population:'kişiye göre DEĞİŞİR',
    note:'Sabit odak süresi olduğu yönünde güçlü bir bulgu yoktur; süreler '
       + 'bir başlangıç noktasıdır ve adayın kendi verisiyle değişmelidir.' },
];
