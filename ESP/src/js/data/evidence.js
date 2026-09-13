/* Kanit katmani — hangi esik nereden geliyor ve NE SOYLEMEYE YETKILI.

   SPI'de dogan, AYS'ye tasinan katmanin ESP'deki hali. Ayni cumle:

     "Deterministik olmak, pedagojik olarak dogru olmak anlamina gelmez."

   ESP'nin merdiveni kesin sayilarla doludur: "son 30 gunde 300+ aktif
   kart ve retansiyon >= 0.75", "temiz BPM >= 100", "hata orani <= %8".
   Kodda hepsi kesindir. Peki 300 neden 300? 0,75 neden 0,75?

   Durust cevap: cogu BU SISTEMIN SECIMIDIR. Bir kismi yayimlanmis bir
   cerceveden gelir (CEFR bantlari, Atesman okunabilirlik formulu), bir
   kismi yerlesmis ogrenme bulgularina dayanir (araliikli tekrar), bir
   kismi da kullanicinin kendi olcumudur. Bunlari birbirine karistirmak,
   bir tasarim tercihini bulgu gibi sunmaktir.

   PEDAGOJIK SINIR (ESP.PEDAGOGIC) burada da gecerlidir: hicbir esik
   yetenek yargisi kurmaz, sertifika vermez, sonuc garantisi uretmez. */

window.ESP = window.ESP || {};

ESP.EVIDENCE_SOURCES = [
  { id:'framework', label:'Yayımlanmış çerçeve',
    note:'Adı konmuş, dışarıda yayımlanmış bir ölçek ya da formül: CEFR '
       + 'bantları, Ateşman okunabilirlik formülü, klasik retorik kanonları.' },
  { id:'research', label:'Öğrenme araştırması',
    note:'Öğrenme bilimi bulgusu: aralıklı tekrar, geri getirme pratiği, '
       + 'ara verilmiş pratik gibi genel kabul görmüş etkiler.' },
  { id:'personal_data', label:'Kendi ölçümün',
    note:'Kullanıcının kendi kaydından hesaplanır: retansiyon, temiz eşik, '
       + 'okuma hızı. Başkasıyla karşılaştırılmaz.' },
  { id:'system_tuning', label:'Sistem ayarı',
    note:'Bu yazılımın pratik sebeplerle seçtiği sayı. Pedagojik bir bulgu '
       + 'değildir ve öyle sunulmaz.' },
];

ESP.EVIDENCE_CERTAINTY = [
  { id:'high',     label:'Yüksek',     note:'Kaynak açık ve tartışmasız.' },
  { id:'moderate', label:'Orta',       note:'Genel kabul var, ayrıntıda değişebilir.' },
  { id:'low',      label:'Düşük',      note:'Dolaylı ya da bağlama çok bağlı.' },
  { id:'unknown',  label:'Bilinmiyor', note:'Kesinlik değerlendirilmemiş.' },
];

ESP.EVIDENCE_APPLICABILITY = [
  { id:'direct',   label:'Doğrudan', note:'Eşik bu disiplin ve bu kişi için doğrudan geçerli.' },
  { id:'indirect', label:'Dolaylı',  note:'Bulgu genel; bu disipline uyarlanırken kayabilir.' },
  { id:'local',    label:'Yerel',    note:'Eşik kişiye özel; başkasıyla karşılaştırılamaz.' },
];

ESP.EVIDENCE_AUTHORITY = [
  { id:'steer',         label:'Kapı açabilir', tone:'ok', mayDirect:true, cap:null,
    note:'Kademe ilerlemesine tam katkıda bulunabilir.' },
  { id:'limited_steer', label:'Sınırlı katkı', tone:'ok', mayDirect:true, cap:0.35,
    note:'Kapı açabilir ama etkisi sınırlıdır.' },
  { id:'inform',        label:'Bilgilendirir', tone:'info', mayDirect:false, cap:0.20,
    note:'Gözlem bildirir; kademe değiştirmez.' },
  { id:'observe_only',  label:'Yalnız izler', tone:'warn', mayDirect:false, cap:0.20,
    note:'Yalnızca izlenir; hiçbir kademe yalnız buna dayandırılmaz.' },
];

ESP.EVIDENCE_POLICY = {
  version:1,
  changedAt:'2026-09-13',
  title:'ESP operasyonel yetki politikası',
  disclaimer:'Bu tablo evrensel bir pedagojik hiyerarşi DEĞİLDİR. '
    + 'ESP\'nin hangi kaynak türüne kademe ilerlemesinde ne kadar söz hakkı '
    + 'tanıdığını söyler. Bilimsel bir iddia değil, bir yazılım kararıdır.',
  rationale:'Yayımlanmış bir çerçeve (CEFR bandı, Ateşman formülü) ve '
    + 'kullanıcının kendi ölçümü doğrudan kapı açabilir; öğrenme araştırması '
    + 'genel bir yön verir ama disipline uyarlanırken kayar; sistemin kendi '
    + 'seçtiği sayılar bir başlangıç noktasıdır ve öyle etiketlenir. '
    + 'Ayrıca beyana dayalı ölçümler ayrı bir kuralla zayıflatılır '
    + '(core/curriculum.js → selfReported).',
  history:[
    { version:1, at:'2026-09-13',
      note:'SPİ\'de doğan dört eksenli katman ESP\'ye taşındı. Sebep: '
         + 'merdiven kapılarının sayılarının çoğu sistemin kendi seçimiydi '
         + 've hiçbiri bunu söylemiyordu.' },
  ],
  defaults:{
    framework:'steer',
    personal_data:'steer',
    research:'limited_steer',
    system_tuning:'observe_only',
  },
};

ESP.EVIDENCE = [

  /* ------------------------------------------------ yayimlanmis cerceve */
  { rule:'lang.cefr', sourceType:'framework', certainty:'high',
    applicability:'indirect',
    cite:'CEFR — Avrupa Ortak Dil Referans Çerçevesi (2020 Tamamlayıcı Cilt), '
       + 'aracılık ve çevrim içi etkileşim ölçekleri dahil',
    population:'dil öğrenenler; bandın kişiye oturması DEĞİŞİR',
    note:'Konu haritalarının dil başlıkları buradan alınmıştır. Dikkat: '
       + 'CEFR\'in ALTI bandı ile ESP\'nin BEŞ merdiven basamağı farklı '
       + 'ölçeklerdir ve birbirine çevrilmez.' },
  { rule:'writing.readability', sourceType:'framework', certainty:'moderate',
    applicability:'direct',
    cite:'Ateşman okunabilirlik formülü — Türkçe için uyarlanmış '
       + 'okunabilirlik ölçeği',
    population:'Türkçe metin',
    note:'Formül yayımlanmıştır ve deterministik hesaplanır. Ama ölçtüğü şey '
       + 'yalnızca cümle ve hece uzunluğudur: anlamı, özgünlüğü ya da '
       + 'doğruluğu ölçmez. Yüksek puan iyi yazı demek değildir.' },
  { rule:'writing.canons', sourceType:'framework', certainty:'moderate',
    applicability:'indirect',
    cite:'Klasik retoriğin beş kanonu (buluş, düzen, üslup, bellek, sunum)',
    population:'yazı ve hitabet',
    note:'İki bin yıllık bir düzenleme çerçevesidir; bir ölçüm aracı değil '
       + 'bir müfredat iskeletidir.' },
  { rule:'reading.levels', sourceType:'framework', certainty:'moderate',
    applicability:'indirect',
    cite:'Adler\'in dört okuma düzeyi (temel, gözden geçirme, analitik, '
       + 'sentopik)',
    population:'derin okuma',
    note:'Düzeyler bir sıra önerir; ölçülebilir bir eşik vermez. Eşikleri '
       + 'bu sistem koymuştur.' },

  /* ---------------------------------------------- ogrenme arastirmasi */
  { rule:'srs.spacing', sourceType:'research', certainty:'moderate',
    applicability:'indirect',
    cite:'Aralıklı tekrar (spacing effect) — tekrarların araya zaman '
       + 'koyularak yapılmasının daha kalıcı olduğu yönündeki yerleşik bulgu',
    population:'genel öğrenen; birey ve malzemeye göre DEĞİŞİR',
    note:'Etkinin varlığı yerleşiktir; KUTU ARALIKLARI (1, 3, 7, 16, 35 gün) '
       + 'bu sistemin seçimidir. Bulgu ile ayarı karıştırmamak gerekir.' },
  { rule:'srs.retrieval', sourceType:'research', certainty:'moderate',
    applicability:'indirect',
    cite:'Geri getirme pratiği (testing effect) — hatırlamaya çalışmanın '
       + 'tekrar okumaktan daha kalıcı olduğu yönündeki yerleşik bulgu',
    population:'genel öğrenen',
    note:'Kart sisteminin varlık sebebi budur.' },
  { rule:'srs.forgetting', sourceType:'research', certainty:'low',
    applicability:'indirect',
    cite:'Unutma eğrisi — hatırlamanın zamanla üstel olarak azaldığı '
       + 'yönündeki klasik gözlem; R(t) = e^(−t/S)',
    population:'malzemeye ve kişiye göre belirgin biçimde DEĞİŞİR',
    note:'Eğrinin BİÇİMİ genel kabul görür; kararlılık parametresi S '
       + 'kişiye ve karta özeldir ve bu sistem onu senin kendi cevap '
       + 'geçmişinden tahmin eder. Mutlak bir retansiyon sayısı değil, '
       + 'kendi geçmişine göre bir tahmindir.' },
  { rule:'music.slowPractice', sourceType:'research', certainty:'low',
    applicability:'indirect',
    cite:'Yavaş ve hatasız tekrarın, hızlı ve hatalı tekrardan daha iyi '
       + 'öğrettiği yönündeki yaygın pedagojik kabul',
    population:'enstrüman çalışması',
    note:'Güçlü bir deneysel literatürden çok, yerleşmiş bir öğretim '
       + 'geleneğidir. Bu yüzden sınırlı katkı verir.' },

  /* ---------------------------------------------------- kendi olcumun */
  { rule:'srs.retention', sourceType:'personal_data', certainty:'moderate',
    applicability:'local',
    cite:'Retansiyon — kendi kart geçmişinden hesaplanan hatırlama tahmini',
    population:'yalnızca bu kullanıcı',
    note:'Bir ÖLÇÜM değil bir HESAPTIR: kartın kararlılığı ve son tekrardan '
       + 'bu yana geçen süreden türetilir. Kesinlik etiketi bu yüzden '
       + '«hesaplandı»dır.' },
  { rule:'music.cleanBpm', sourceType:'personal_data', certainty:'low',
    applicability:'local',
    cite:'Temiz eşik — kullanıcının kendi işaretlediği temiz tekrarlar',
    population:'yalnızca bu kullanıcı',
    note:'«Temiz» kararını sistem vermez, kullanıcı verir. Bu bir BEYANDIR '
       + 've kapıyı zayıf açar (core/curriculum.js → selfReported).' },
  { rule:'diction.errorRate', sourceType:'personal_data', certainty:'low',
    applicability:'local',
    cite:'Hata oranı — kullanıcının kendi işaretlediği hata sayısı / kelime',
    population:'yalnızca bu kullanıcı',
    note:'Sistem sesi dinlemez. Hataları kullanıcı işaretler; bu bir beyandır '
       + 've kapıyı zayıf açar. Asgari beş kayıt şartı vardır.' },
  { rule:'intellect.ehs', sourceType:'personal_data', certainty:'low',
    applicability:'local',
    cite:'EHS — Σ(disiplin ağırlığı × ölçülen saat × kalite katsayısı)',
    population:'yalnızca bu kullanıcı',
    note:'Bir hacim ölçüsüdür, bir başarı ölçüsü değil. Ağırlıklar ve '
       + 'katsayılar bu sistemin seçimidir; sayı yalnızca KENDİ geçmişinle '
       + 'karşılaştırılır.' },

  /* -------------------------------------------------- sistemin secimi */
  { rule:'ladder.levels', sourceType:'system_tuning', certainty:'unknown',
    cite:'Bu sistemin seçimi — beş kademe (Acemi, Çırak, Kalfa, Usta, Üstat)',
    population:'—',
    note:'Beş basamak pedagojik bir bulgu DEĞİLDİR; lonca geleneğinden '
       + 'alınmış bir anlatı çerçevesidir. Seçilme sebebi şu: bu adlar bir '
       + 'SÜREÇ anlatır, bir yetenek yargısı değil. Dört ya da yedi basamak '
       + 'da savunulabilirdi.' },
  { rule:'ladder.gates', sourceType:'system_tuning', certainty:'unknown',
    applicability:'indirect',
    cite:'Bu sistemin seçimi — kapı eşikleri (300 kart, %75 retansiyon, '
       + '100 BPM, %8 hata oranı ve benzerleri)',
    population:'disipline ve kişiye göre DEĞİŞİR',
    note:'Bu sayıların hiçbiri bir literatürden gelmez. Ölçülebilir olmaları '
       + 'için seçilmişlerdir: ölçülemeyen bir kapı, kullanıcının kendine '
       + 'söylediği bir hikâyedir. Sayının kendisi tartışmaya açıktır ve bu '
       + 'açıkça yazılıdır.' },
  { rule:'srs.boxes', sourceType:'system_tuning', certainty:'unknown',
    cite:'Bu sistemin seçimi — Leitner kutu aralıkları (1, 3, 7, 16, 35 gün)',
    population:'—',
    note:'Aralıklı tekrar bulgusu "araya zaman koy" der, "yedi gün" demez. '
       + 'Bu sayılar yaygın uygulamadan alınmış pratik bir başlangıçtır ve '
       + 'SM-2 kolaylık katsayısıyla kişiye göre kayar.' },
  { rule:'coach.dose', sourceType:'system_tuning', certainty:'unknown',
    applicability:'indirect',
    cite:'Bu sistemin seçimi — günlük reçete süreleri ve tekrar sayıları',
    population:'kişiye göre DEĞİŞİR',
    note:'Reçete bir öneridir, bir doz değil. Süreler bir başlangıç '
       + 'noktasıdır ve kullanıcının kendi verisiyle değişmelidir.' },
  { rule:'friction.budget', sourceType:'system_tuning', certainty:'unknown',
    cite:'Bu sistemin seçimi — sürtünme bütçesi (12 dk/gün, %34 pay)',
    population:'—',
    note:'İki eşik de açıkça seçilmiş sınırlardır, bir bulgu değil. Sebebi '
       + 'pratiktir: ikisi birden aşılmadıkça sistem susar, çünkü tek eşiğin '
       + 'aşılması bir kurulum günü olabilir.' },
];
