/* 40 haftalik uygulama plani — "Hemsirelik Hedefi" belgesinin 4. bolumu.
   Tarihler formulle uretilir: program 14 Eylul 2026 Pazartesi baslar, her hafta 7 gundur. */

window.R = window.R || {};

R.PROGRAM = {
  startISO: '2026-09-14',
  totalWeeks: 40,
  examTytISO: '2027-06-19',   // tahmin — ÖSYM duyurusuyla guncellenir
  examAytISO: '2027-06-20',   // tahmin
  city: 'Adana',
  program: 'Çukurova Üniversitesi Hemşirelik',
  refRank: 84285,
  refYear: 2026,
  refQuota: 120,
  capacityHoursPerWeek: 21,   // 3–4 saat x 6 gun
  studyDaysPerWeek: 6,
};

/* Programin canli parametreleri.
   R.PROGRAM plandaki varsayilanlardir; R.PLAN kullanicinin profilinden okur.
   Boylece baslangic tarihi ve sinav tarihi serbestce degistirilebilir,
   takvim yeniden hesaplanir. */
R.PLAN = {
  get startISO(){
    return (R.S && R.S.profile && R.S.profile.startDate) || R.PROGRAM.startISO;
  },
  get examTytISO(){
    return (R.S && R.S.profile && R.S.profile.examTytISO) || R.PROGRAM.examTytISO;
  },
  get examAytISO(){
    return (R.S && R.S.profile && R.S.profile.examAytISO) || R.PROGRAM.examAytISO;
  },
  /* Takvimde kac tam hafta var? En fazla 40 (mufredatin uzunlugu). */
  get totalWeeks(){
    if(!R.S || !R.S.profile || !R.U) return R.PROGRAM.totalWeeks;
    // Sinav gununu iceren hafta da programa dahildir.
    const days = R.U.diffDays(R.PLAN.startISO, R.PLAN.examTytISO);
    const weeks = Math.ceil((days + 1) / 7);
    return Math.max(1, Math.min(R.PROGRAM.totalWeeks, weeks));
  },
  /* Takvim 40 haftadan kisaysa plan sikistirilir. */
  get compressed(){ return R.PLAN.totalWeeks < R.PROGRAM.totalWeeks; },
};

/* Aylik fazlar — planin bolum basliklari */
R.PHASES = [
  { key:'eylul',   label:'Eylül 2026',   theme:'Kalibrasyon ve TYT temel',   weeks:[1,3] },
  { key:'ekim',    label:'Ekim 2026',    theme:'TYT çekirdek',              weeks:[4,7] },
  { key:'kasim',   label:'Kasım 2026',   theme:'Problem ve karar kapısı',   weeks:[8,12] },
  { key:'aralik',  label:'Aralık 2026',  theme:'AYT köprüsü',               weeks:[13,16] },
  { key:'ocak',    label:'Ocak 2027',    theme:'Çift kulvar',               weeks:[17,20] },
  { key:'subat',   label:'Şubat 2027',   theme:'Yoğunlaştırma ve başvuru',  weeks:[21,24] },
  { key:'mart',    label:'Mart 2027',    theme:'AYT tamamlama',             weeks:[25,29] },
  { key:'nisan',   label:'Nisan 2027',   theme:'İkinci tur ve deneme',      weeks:[30,33] },
  { key:'mayis',   label:'Mayıs 2027',   theme:'Prova',                     weeks:[34,38] },
  { key:'haziran', label:'Haziran 2027', theme:'Sprint ve azaltma',         weeks:[39,40] },
];

/* q: yeni ve bagimsiz soru hedefi (konu anlatimi ornekleri ve tam deneme sorulari haric) */
R.CURRICULUM = [
  { n:1,  title:'Kalibrasyon: TYT Türkçe ve Temel Matematik', topics:['Tam TYT başlangıç denemesi','Paragraf – anlam','Temel kavramlar ve dört işlem'], q:250, exam:'1 tam TYT + tanı amaçlı AYT SAY (süresiz)', check:'Başlangıç test netleri, süreler, OBP ve hata envanteri kaydedildi mi?' },
  { n:2,  title:'Çalışma sistemi kurulumu', topics:['Paragraf','Sayı basamakları','TYT hücre – canlıların ortak özellikleri'], q:300, exam:'2 Türkçe + 1 Matematik mini deneme', check:"6 günün en az 5'i tamamlandı mı; kaynaklar ve yanlış defteri kuruldu mu?" },
  { n:3,  title:'TYT çekirdek I', topics:['Sözcük / cümlede anlam','Bölme – bölünebilme','Atom – periyodik sistem'], q:350, exam:'1 Türkçe branş + 1 Matematik mini', check:'Konu sonrası doğruluk en az %60 mı?' },
  { n:4,  title:'TYT çekirdek II', topics:['Paragraf ana düşünce','EBOB – EKOK / rasyonel','Fizik madde – özellikleri'], q:380, exam:'1 Türkçe + 1 Matematik branş', check:'Son iki haftada soru tamamlama oranı en az %85 mi?' },
  { n:5,  title:'TYT çekirdek III', topics:['Yazım','Basit eşitsizlik – mutlak değer','TYT kimyasal etkileşimler'], q:400, exam:'1 TYT kesit (Türkçe + Matematik) + 1 Fen mini', check:'Yanlışların en büyük iki etiketi belirlendi mi?' },
  { n:6,  title:'TYT çekirdek IV', topics:['Noktalama','Üslü – köklü sayılar','Hücre ve organeller'], q:420, exam:'1 Türkçe + 1 Matematik branş', check:'Türkçe süre/40 soru tahmini ve matematik işlem hata oranı kaydedildi mi?' },
  { n:7,  title:'Denklem ve geometri başlangıcı', topics:['Cümle bilgisi','Çarpanlara ayırma – denklem','Doğruda / üçgende açılar'], q:440, exam:'1 tam TYT (kontrol) + 1 geometri mini', check:'TYT başlangıca göre artıyor mu; artmıyorsa hata türü değişti mi?' },
  { n:8,  title:'Problemlere giriş', topics:['Sayı – kesir problemleri','Oran – orantı','TYT ısı – sıcaklık'], q:460, exam:'1 Türkçe + 1 Matematik branş', check:'Problem doğruluğu en az %55 mi?' },
  { n:9,  title:'Problemler I', topics:['Yüzde – kâr zarar','Üçgende açı – kenar','TYT karışımlar'], q:480, exam:'1 tam TYT + 1 Fen mini', check:'Kasım ara trendi: son 3 TYT medyanı yükseliyor mu?' },
  { n:10, title:'Problemler II', topics:['Yaş ve karışım','Üçgende benzerlik','Temel bileşenler'], q:500, exam:'1 Türkçe + 1 Matematik branş', check:'Yavaş soru listesinde ilk beş kalıp çıkarıldı mı?' },
  { n:11, title:'Problemler III', topics:['Hareket','Açıortay – kenarortay','Kuvvet – hareket'], q:520, exam:'1 tam TYT + 2 branş', check:'Kasım kapısı TYT 35–45; altındaysa 14 günlük telafi açıldı mı?' },
  { n:12, title:'AYT köprüsü', topics:['TYT işçi – havuz','Kümeler – mantık','AYT fonksiyon önkoşulları'], q:530, exam:'1 tam TYT + AYT Matematik tanı', check:"2027 takvimi ÖSYM'den kontrol edilip plana işlendi mi?" },
  { n:13, title:'AYT Matematik I', topics:['Fonksiyonlar','Polinom giriş','TYT paragraf ve problem koruma'], q:540, exam:'1 TYT + 1 AYT Matematik branş', check:'Fonksiyon temel testinde en az %60 doğruluk var mı?' },
  { n:14, title:'AYT Matematik II / Biyoloji I', topics:['Polinomlar','2. derece denklemler','Mitoz – mayoz'], q:560, exam:'1 TYT + AYT Matematik / Biyoloji mini', check:'AYT toplam ilk ölçümü ve konu bazlı doğruluk kaydedildi mi?' },
  { n:15, title:'AYT Kimya temeli', topics:['Mol – stokiyometri','Fonksiyon / polinom tekrar','TYT dörtgenler'], q:570, exam:'1 tam TYT + 2 AYT branş', check:'Mol işlem zincirinde hata kaynağı birim mi, oran mı?' },
  { n:16, title:'Konsolidasyon haftası', topics:['Eylül–Aralık eksiklerinin ilk üçü','Paragraf – problem rutini'], q:450, exam:'1 tam TYT + 1 AYT SAY kesit', check:'Aralık kapısı TYT 45–55 ve AYT 8–15 yönünde mi?' },
  { n:17, title:'AYT Matematik III', topics:['Trigonometri temel','Analitik doğru','Biyoloji kalıtım giriş'], q:580, exam:'1 TYT + 1 AYT Matematik + 1 Biyoloji', check:'Trigonometri temel oran / formül kartları eksiksiz mi?' },
  { n:18, title:'AYT Kimya II / Fizik I', topics:['Gazlar','Vektörler – hareket','Kalıtım problem pratiği'], q:600, exam:'1 tam TYT + 2 AYT branş', check:'AYT Fen üç dersinin hiçbiri sıfır bırakılıyor mu?' },
  { n:19, title:'AYT Matematik IV', topics:['Logaritma','Diziler','TYT olasılık – istatistik'], q:620, exam:'1 TYT + 1 AYT Matematik + 1 Fen', check:'Logaritma / dizi karma testinde en az %65 doğruluk var mı?' },
  { n:20, title:'Ocak karar kapısı', topics:['Limit giriş','İnsan fizyolojisi sinir – endokrin','Kimya çözeltiler'], q:630, exam:'1 tam TYT + 1 tam AYT SAY', check:'Ocak kapısı TYT 50–60, AYT 18–25; sapma için Şubat ağırlığı seçildi mi?' },
  { n:21, title:'Yoğunlaştırma I', topics:['Limit','Dolaşım – bağışıklık','Newton ve enerji'], q:650, exam:'1 tam TYT + 1 AYT SAY + 2 branş', check:'Tam denemelerin analizi 24 saat içinde bitti mi?' },
  { n:22, title:'Yoğunlaştırma II', topics:['Türev kavramı','Solunum – sindirim','Tepkime enerjisi – hız'], q:670, exam:'1 tam TYT + 1 AYT SAY + 2 branş', check:'AYT süresinde hangi test sırası daha iyi sonuç veriyor?' },
  { n:23, title:'Yoğunlaştırma III', topics:['Türev uygulamaları','Boşaltım – üreme','Momentum'], q:680, exam:'1 tam TYT + 1 AYT SAY + 2 branş', check:'Türevde grafik / yorum ve işlem hataları ayrı ölçüldü mü?' },
  { n:24, title:'Başvuru güvenlik haftası', topics:['İntegral giriş','Destek – hareket / duyu','Kimyasal denge'], q:650, exam:'1 tam TYT + 1 AYT SAY', check:'Başvuru varsa AİS bilgileri, ücret ve TYT + AYT oturumları doğrulandı mı?' },
  { n:25, title:'AYT tamamlama I', topics:['İntegral uygulama','Asit – baz dengesi','Elektrik alan – potansiyel'], q:700, exam:'1 tam TYT + 1 tam AYT + 2 branş', check:'Şubat sonunda AYT konu kapanış yüzdesi en az %55 mi?' },
  { n:26, title:'AYT tamamlama II', topics:['Analitik geometri','Çözünürlük','Bitki biyolojisi'], q:720, exam:'1 tam TYT + 1 tam AYT + 2 branş', check:'Başvuru kesinleşti mi; belge ve aday fotoğrafı kontrol edildi mi?' },
  { n:27, title:'Fen getiri haftası', topics:['Elektrokimya','İndüksiyon – AC','Enerji dönüşümleri'], q:740, exam:'1 tam TYT + 1 tam AYT + 3 branş', check:'Fen branşlarında son üç sonuçtan medyan alındı mı?' },
  { n:28, title:'Karma konu I', topics:['Permütasyon – kombinasyon – binom','Basit harmonik hareket','Ekoloji'], q:750, exam:'1 tam TYT + 1 tam AYT + 3 branş', check:'Matematikte en çok net kaybettiren üç konu seçildi mi?' },
  { n:29, title:'Mart karar kapısı', topics:['AYT karma matematik','Organik giriş','Biyoteknoloji – evrim'], q:760, exam:'2 tam TYT + 1 tam AYT + 2 branş', check:'Mart kapısı TYT 60–70, AYT 25–32; AYT Matematik 10 altı mı?' },
  { n:30, title:'İkinci tur I', topics:['Fonksiyon – trigonometri – logaritma tarama','TYT Fen tarama'], q:780, exam:'2 tam TYT + 1 tam AYT + 3 branş', check:'Konu eksiği hatalarının payı azalıyor mu?' },
  { n:31, title:'İkinci tur II', topics:['Limit – türev – integral tarama','Organik','Dalga mekaniği'], q:800, exam:'2 tam TYT + 2 tam AYT + 2 branş', check:'Deneme ortalaması değil son 4 medyanı hedef bantta mı?' },
  { n:32, title:'İkinci tur III', topics:['İnsan fizyolojisi / genetik karma','Elektrik – manyetizma karma'], q:800, exam:'2 tam TYT + 2 tam AYT + 3 branş', check:'Biyoloji ve kimyada kart gecikmesi sıfıra yakın mı?' },
  { n:33, title:'Nisan karar kapısı', topics:['Tam kapsam eksik kapama','Yüksek getirili üç açık'], q:700, exam:'2 tam TYT + 2 tam AYT + 3 branş', check:'Nisan kapısı TYT 65–75, AYT 30–35; düşük test için mikro plan yazıldı mı?' },
  { n:34, title:'Prova I', topics:['Karma setler','Problem ve paragraf hız','Fen bilgi kartları'], q:650, exam:'2 TYT + 2 AYT, ikisi gerçek saatte', check:"Süre taşması TYT'de 5 dk, AYT'de 10 dk altında mı?" },
  { n:35, title:'Prova II', topics:['Yanlış defteri ilk yarı','AYT Matematik seçilmiş 3 zayıf konu'], q:620, exam:'3 TYT + 2 AYT + 2 branş', check:'Son 5 denemede taban skor yükseliyor mu?' },
  { n:36, title:'Prova III', topics:['Yanlış defteri ikinci yarı','Fen karma','Geometri günlük 10 soru'], q:600, exam:'3 TYT + 2 AYT, bir hafta sonu çift oturum', check:'İki günlük sınav provasında uyku ve beslenme sürdürüldü mü?' },
  { n:37, title:'Prova IV', topics:['ÖSYM çıkmış soru dili','Analizden doğan mikro konular'], q:550, exam:'3 TYT + 3 AYT', check:'Yayın zorluğundan bağımsız test bazlı istikrar var mı?' },
  { n:38, title:'Son tam yük', topics:['Formül – kart turu','Yüksek frekanslı hatalar','Hız setleri'], q:500, exam:'3 TYT + 3 AYT, tam çift gün provası', check:'Hedef: TYT 65–80, AYT 30–40 bandına en az iki kez girildi mi?' },
  { n:39, title:'Sprint ve azaltma', topics:['Yeni konu yok','Yanlış defteri','Kısa karma set','Uyku hizalama'], q:350, exam:"2 TYT + 2 AYT; son ağır deneme 10 Haziran'a kadar", check:'Son 4 medyanı ve kötü gün tabanı güvenli mi?' },
  { n:40, title:'Sınav haftası / taper', topics:['Kartlar','Kolay – orta güven setleri','Evrak ve rota'], q:150, exam:'Pzt kısa TYT, Sal kısa AYT; Çar sonrası tam deneme yok', check:'Kimlik – belge – rota hazır mı; Cuma ve Cumartesi uyku saati sabit mi?' },
];

/* Haftalik temel gun dagilimi (bolum 2.4) + blok sureleri (bolum 2.1).
   0 = Pazartesi ... 6 = Pazar */
R.WEEKDAYS = [
  { label:'Pazartesi', short:'Pzt', ritual:'contract',
    blocks:[ {slot:'Ana ders', subject:'TYT / AYT Matematik', min:75}, {slot:'İkinci ders', subject:'Biyoloji', min:65}, {slot:'Rutin', subject:'Paragraf + Kart', min:40} ] },
  { label:'Salı', short:'Sal',
    blocks:[ {slot:'Ana ders', subject:'Türkçe', min:75}, {slot:'İkinci ders', subject:'AYT Matematik', min:65}, {slot:'Rutin', subject:'Yanlış defteri', min:40} ] },
  { label:'Çarşamba', short:'Çar',
    blocks:[ {slot:'Ana ders', subject:'Matematik / Problem', min:75}, {slot:'İkinci ders', subject:'Kimya', min:65}, {slot:'Rutin', subject:'Paragraf', min:40} ] },
  { label:'Perşembe', short:'Per',
    blocks:[ {slot:'Ana ders', subject:'AYT Matematik / Geometri', min:75}, {slot:'İkinci ders', subject:'TYT Fen', min:65}, {slot:'Rutin', subject:'Kart + Kısa test', min:40} ] },
  { label:'Cuma', short:'Cum',
    blocks:[ {slot:'Ana ders', subject:'Fizik', min:75}, {slot:'İkinci ders', subject:'Biyoloji / Kimya', min:65}, {slot:'Rutin', subject:'Yanlış tamiri', min:40} ] },
  { label:'Cumartesi', short:'Cmt', ritual:'exam',
    blocks:[ {slot:'Deneme', subject:'Deneme (gerçek süre)', min:165}, {slot:'Analiz', subject:'Deneme analizi', min:60}, {slot:'Mikro konu', subject:'Eksik mikro konu', min:40} ] },
  { label:'Pazar', short:'Paz', ritual:'review',
    blocks:[ {slot:'Review', subject:'Weekly review', min:35}, {slot:'Dinlenme', subject:'Dinlenme', min:0}, {slot:'Kart', subject:'Hafif kart (gerekirse)', min:20} ] },
];
